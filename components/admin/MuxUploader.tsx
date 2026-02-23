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
    <div className="w-full rounded-2xl border border-gray-100 bg-gray-50/80 p-3 md:p-4">
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
        noStatus
        noRetry
        className="mux-upload-field w-full"
      >
        <p slot="heading" className="np-uploader-heading">
          Slip videofil her for upload
        </p>
        <p slot="separator" className="np-uploader-separator">
          eller
        </p>
        <button type="button" slot="file-select" className="np-uploader-button">
          Vælg videofil
        </button>
      </MuxUploader>

      {status && (
        <div className="mt-3 rounded-xl border border-blue-100 bg-blue-50 px-3 py-2 animate-in fade-in slide-in-from-top-2">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 text-center">{status}</p>
        </div>
      )}

      <style jsx global>{`
        mux-uploader {
          --progress-bar-fill-color: #2563eb;
          --progress-bar-background-color: #dbeafe;
          --progress-bar-height: 6px;
          --overlay-background-color: rgba(239, 246, 255, 0.9);
          --display: flex;
          --flex-direction: column;
          --gap: 1rem;
        }

        mux-uploader.mux-upload-field::part(drop) {
          border: 1px dashed #bfdbfe;
          border-radius: 1rem;
          padding: 1rem 0.9rem;
          min-height: 180px;
          background: #f8fbff;
        }

        mux-uploader.mux-upload-field::part(file-select) {
          margin-top: 0.25rem;
        }

        .np-uploader-heading {
          margin: 0;
          color: #0f172a;
          font-size: clamp(1rem, 2.8vw, 1.65rem);
          line-height: 1.25;
          text-align: center;
          font-weight: 700;
          letter-spacing: -0.01em;
          text-transform: none;
        }

        .np-uploader-separator {
          margin: 0;
          color: #64748b;
          font-size: 0.75rem;
          line-height: 1;
          text-transform: uppercase;
          letter-spacing: 0.14em;
          font-weight: 700;
        }

        .np-uploader-button {
          border-radius: 0.75rem;
          background: #2563eb;
          color: #fff;
          border: 1px solid #1d4ed8;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          padding: 0.7rem 1rem;
          min-width: 170px;
          transition: background-color 0.2s ease, transform 0.12s ease;
          width: 100%;
          max-width: 220px;
          cursor: pointer;
        }

        .np-uploader-button:hover {
          background: #1d4ed8;
        }

        .np-uploader-button:active {
          transform: scale(0.98);
        }

        mux-uploader.mux-upload-field::part(progress) {
          margin-top: 0.35rem;
        }

        @media (max-width: 640px) {
          mux-uploader.mux-upload-field::part(drop) {
            min-height: 160px;
            padding: 0.9rem 0.75rem;
          }

          .np-uploader-button {
            max-width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
