"use client";

import MuxUploader from "@mux/mux-uploader-react";
import { useRef, useState } from "react";

interface Props {
  onUploadSuccess: (uploadId: string) => void;
}

export default function MuxVideoUploader({ onUploadSuccess }: Props) {
  const [status, setStatus] = useState<string | null>(null);
  const uploadIdRef = useRef<string>("");

  return (
    <div className="w-full flex flex-col items-center justify-center p-4 md:p-8 bg-gray-50 rounded-[1.5rem] md:rounded-[2rem] border-2 border-dashed border-gray-100 transition-all hover:border-blue-200">
      <MuxUploader
        endpoint={async () => {
          const res = await fetch("/api/uploads", { method: "POST" });
          if (!res.ok) throw new Error("Kunne ikke hente upload-endpoint.");

          const data = (await res.json()) as { id: string; url: string };
          uploadIdRef.current = data.id;
          return data.url;
        }}
        onSuccess={() => {
          setStatus("Upload er færdig. Vi behandler videoen...");
          if (!uploadIdRef.current) {
            setStatus("Kunne ikke finde upload-ID. Prøv igen.");
            return;
          }
          onUploadSuccess(uploadIdRef.current);
        }}
        onError={(event) => {
          const detail = (event as unknown as { detail?: unknown }).detail;
          console.error("Uploader-fejl:", detail);
          setStatus("Der opstod en fejl under upload.");
        }}
        onProgress={(event) => {
          const detail = (event as unknown as { detail?: unknown }).detail;
          const progress = typeof detail === "number" ? detail : 0;
          setStatus(`Uploader: ${Math.round(progress)}%`);
        }}
        className="w-full"
      />

      {status && (
        <div className="mt-4 px-4 py-2 bg-blue-50 border border-blue-100 rounded-xl animate-in fade-in slide-in-from-top-2">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 text-center">{status}</p>
        </div>
      )}

      <style jsx global>{`
        mux-uploader {
          --progress-bar-fill-color: #2563eb;
          --button-background-color: #2563eb;
          --button-text-color: #ffffff;
          --button-border-radius: 1rem;
          --button-padding: 0.85rem 1.5rem;
          --button-font-size: 0.75rem;
          --button-font-weight: 900;
          --button-text-transform: uppercase;
          --button-letter-spacing: 0.1em;
          --display: flex;
          --flex-direction: column;
          --gap: 1.5rem;
        }

        mux-uploader::part(button) {
          width: 100%;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow:
            0 4px 6px -1px rgb(37 99 235 / 0.1),
            0 2px 4px -2px rgb(37 99 235 / 0.1);
        }

        mux-uploader::part(button):hover {
          background-color: #1d4ed8;
          transform: translateY(-1px);
          box-shadow: 0 10px 15px -3px rgb(37 99 235 / 0.2);
        }

        mux-uploader::part(button):active {
          transform: scale(0.98);
        }

        mux-uploader::part(progress) {
          background-color: #f1f5f9;
          border-radius: 999px;
          height: 8px;
        }
      `}</style>
    </div>
  );
}
