"use client";

interface EmbedPreviewModalProps {
  embedId: string;
  onClose: () => void;
}

export default function EmbedPreviewModal({ embedId, onClose }: EmbedPreviewModalProps) {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full max-w-5xl aspect-video bg-black shadow-2xl z-10 overflow-hidden rounded-[2rem] border border-white/10 animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-50 bg-black/40 hover:bg-black/80 text-white p-2.5 rounded-full transition-all border border-white/10 active:scale-90"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
        <iframe src={`/embed/${embedId}`} className="w-full h-full border-none" allow="autoplay; fullscreen" />
      </div>
    </div>
  );
}
