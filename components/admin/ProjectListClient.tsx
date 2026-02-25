"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";

const EmbedCodeGenerator = dynamic(() => import("./EmbedCodeGenerator"), {
  loading: () => <p className="text-xs font-semibold text-gray-500">Indlæser embed-kode...</p>,
});

interface ProjectListClientProps {
  initialProjects: Array<{
    id: string;
    name: string;
    groups?: Array<{
      variants: Array<{
        muxPlaybackId: string | null;
      }>;
    }>;
  }>;
}

export default function ProjectListClient({ initialProjects }: ProjectListClientProps) {
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [showEmbedId, setShowEmbedId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const router = useRouter();

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Er du sikker på, at du vil slette "${name}"?`)) return;
    setIsDeleting(id);

    try {
      const res = await fetch(`/api/embeds/${id}`, { method: "DELETE" });
      if (res.ok) {
        router.refresh();
      } else {
        alert("Der opstod en fejl under sletning af projektet.");
      }
    } catch (error) {
      console.error("Sletning fejlede:", error);
    } finally {
      setIsDeleting(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-6">
        {initialProjects.map((project) => (
          <article
            key={project.id}
            className="group relative bg-white border border-gray-100 p-6 md:p-8 rounded-[2rem] flex flex-col lg:flex-row lg:items-center justify-between shadow-sm hover:shadow-xl hover:border-blue-100 transition-all duration-300 gap-6"
          >
            <Link
              href={`/admin/embed/${project.id}`}
              className="absolute inset-0 rounded-[2rem] z-0"
              aria-label={`Rediger projekt ${project.name}`}
            />

            <div className="space-y-1">
              <h2 className="text-xl md:text-2xl font-bold text-gray-900 uppercase tracking-tight leading-tight">
                {project.name}
              </h2>
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                  ID: {project.id.slice(0, 8)}...
                </span>
                <PosterFramePattern project={project} />
              </div>
            </div>

            <div className="relative z-10 flex w-full lg:w-auto flex-wrap items-center gap-2 sm:gap-3">
              <button
                onClick={() => setShowEmbedId(project.id)}
                className="flex-1 sm:flex-none min-w-[140px] bg-gray-50 text-gray-700 px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-100 transition flex items-center justify-center gap-2 active:scale-95"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5" />
                </svg>
                Hent embed-kode
              </button>

              <Link
                href={`/admin/embed/${project.id}`}
                className="flex-1 sm:flex-none min-w-[110px] bg-blue-50 text-blue-600 px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-100 transition text-center active:scale-95"
              >
                Redigér
              </Link>

              <button
                onClick={() => setPreviewId(project.id)}
                className="flex-1 sm:flex-none min-w-[90px] bg-black text-white px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-800 transition text-center active:scale-95 shadow-lg shadow-black/10"
              >
                Vis
              </button>

              <button
                onClick={() => handleDelete(project.id, project.name)}
                disabled={isDeleting === project.id}
                className="w-full sm:w-auto p-3 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-2xl transition flex items-center justify-center active:scale-90"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-1.851c0-1.03-.784-1.913-1.812-1.947a45.108 45.108 0 0 0-3.322 0c-1.028.034-1.812 0.917-1.812 1.947v1.851m10.5 0a48.009 48.009 0 0 0-9.003 0" />
                </svg>
              </button>
            </div>
          </article>
        ))}
      </div>

      {showEmbedId && (
        <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setShowEmbedId(null)} />
          <div className="relative w-full max-w-xl bg-white rounded-[2.5rem] p-8 md:p-10 shadow-2xl animate-in slide-in-from-bottom-10 sm:zoom-in duration-300">
            <button onClick={() => setShowEmbedId(null)} className="absolute top-6 right-6 text-gray-300 hover:text-gray-900 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 uppercase tracking-tight">Embed-kode</h2>
              <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mt-2">Integrér videoafspilleren på din platform</p>
            </div>
            <EmbedCodeGenerator
              projectId={showEmbedId}
              projectTitle={initialProjects.find((p) => p.id === showEmbedId)?.name || "Video"}
            />
          </div>
        </div>
      )}

      {previewId && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setPreviewId(null)} />
          <div className="relative w-full max-w-5xl aspect-video bg-black shadow-2xl z-10 overflow-hidden rounded-[2rem] border border-white/10 animate-in fade-in zoom-in-95 duration-200">
            <button onClick={() => setPreviewId(null)} className="absolute top-4 right-4 z-50 bg-black/40 hover:bg-black/80 text-white p-2.5 rounded-full transition-all border border-white/10 active:scale-90">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
            </button>
            <iframe src={`/embed/${previewId}`} className="w-full h-full border-none" allow="autoplay; fullscreen" />
          </div>
        </div>
      )}
    </div>
  );
}

function PosterFramePattern({
  project,
}: {
  project: ProjectListClientProps["initialProjects"][number];
}) {
  const playbackIds = (project.groups || [])
    .flatMap((group) => group.variants || [])
    .map((variant) => variant.muxPlaybackId)
    .filter((id): id is string => Boolean(id));

  const unique = Array.from(new Set(playbackIds)).slice(0, 6);
  if (unique.length === 0) {
    return null;
  }

  return (
    <div className="hidden sm:flex items-center -space-x-2">
      {unique.map((playbackId, index) => (
        <div
          key={playbackId}
          className="h-7 w-7 rounded-md overflow-hidden border border-white shadow-sm bg-gray-100"
          style={{ zIndex: unique.length - index }}
          title={`Poster ${index + 1}`}
        >
          <Image
            src={`https://image.mux.com/${playbackId}/thumbnail.jpg?time=0&width=80&height=80&fit_mode=smartcrop`}
            alt=""
            width={28}
            height={28}
            className="h-full w-full object-cover"
          />
        </div>
      ))}
    </div>
  );
}

