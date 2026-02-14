"use client";

import MuxUploader from "@mux/mux-uploader-react";
import { useState } from "react";

interface Props {
  variantId: string;
  onUploadSuccess: () => void;
}

export default function MuxVideoUploader({ variantId, onUploadSuccess }: Props) {
  const [status, setStatus] = useState<string | null>(null);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-gray-900/50 rounded-xl">
      <MuxUploader
        endpoint={async () => {
          const res = await fetch("/api/uploads", {
            method: "POST",
            body: JSON.stringify({ variantId }),
          });
          
          if (!res.ok) throw new Error("Kunne ikke hente upload endpoint");
          
          const data = await res.json();
          return data.url;
        }}
        onSuccess={() => {
          setStatus("Upload færdig! Behandler...");
          onUploadSuccess();
        }}
        // Rettelse her: Vi caster 'e' til 'any' for at undgå detail-fejlen hurtigt
        // eller bruger 'as CustomEvent' for den korrekte måde
        onError={(e: any) => {
          console.error("Uploader fejl:", e.detail);
          setStatus("Fejl under upload.");
        }}
        onProgress={(e: any) => {
          setStatus(`Uploader: ${Math.round(e.detail)}%`);
        }}
        className="w-full text-white"
      />
      
      {status && (
        <p className="mt-4 text-[10px] font-black uppercase tracking-widest text-blue-400 animate-pulse">
          {status}
        </p>
      )}

      <style jsx global>{`
        mux-uploader {
          --progress-bar-fill-color: #2563eb;
          --button-background-color: #ffffff;
          --button-text-color: #000000;
          --display: flex;
          --flex-direction: column;
        }
      `}</style>
    </div>
  );
}