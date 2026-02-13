"use client";

import { useState } from "react";
import MuxUploader from "@mux/mux-uploader-react";

interface MuxUploaderProps {
  variantId: string; // Tilføjet så fejlen forsvinder
  onUploadSuccess: () => void;
}

export default function MuxUploaderComponent({ variantId, onUploadSuccess }: MuxUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);

  // Denne funktion henter en sikker upload-URL fra din server
  const getUploadUrl = async () => {
    const res = await fetch("/api/mux/upload", {
      method: "POST",
      body: JSON.stringify({ variantId }), // Vi sender variantId med her
    });
    const data = await res.json();
    return data.url; // URL fra Mux via din API rute
  };

  return (
    <div className="w-full">
      {!isUploading ? (
        <div className="flex flex-col items-center">
          <MuxUploader
            endpoint={getUploadUrl}
            onUploadStart={() => setIsUploading(true)}
            onSuccess={() => {
              setIsUploading(false);
              onUploadSuccess();
            }}
            onUploadError={(err) => {
              console.error("Upload fejl:", err);
              setIsUploading(false);
              alert("Der skete en fejl under upload.");
            }}
            style={{
              "--upload-button-border-radius": "8px",
              "--upload-button-background": "#2563eb",
              "--button-color": "#ffffff",
            } as React.CSSProperties}
          />
          <p className="mt-2 text-[10px] text-gray-400">Vælg en videofil (MP4, MOV osv.)</p>
        </div>
      ) : (
        <div className="text-center py-4">
          <div className="animate-pulse text-blue-600 font-bold text-xs uppercase tracking-widest">
            Uploader...
          </div>
          <p className="text-[10px] text-gray-400 mt-1 italic">Lad vinduet forblive åbent</p>
        </div>
      )}
    </div>
  );
}