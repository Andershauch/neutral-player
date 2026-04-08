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
        posterFrameUrl?: string | null;
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

  const selectedProject = initialProjects.find((project) => project.id === showEmbedId) || null;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-5 md:gap-6">
        {initialProjects.map((project) => (
          <article
            key={project.id}
            className="group relative flex flex-col justify-between gap-4 rounded-2xl border border-gray-200/90 bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.08)] transition-all duration-300 hover:border-blue-200 hover:shadow-[0_16px_36px_rgba(15,23,42,0.12)] lg:flex-row lg:items-start md:gap-5 md:p-7"
          >
            <Link href={`/admin/embed/${project.id}`} className="absolute inset-0 z-0 rounded-2xl" aria-label={`Rediger projekt ${project.name}`} />

            <div className="min-w-0 flex-1 space-y-3">
              <div className="flex items-stretch justify-between gap-4">
                <h2 className="min-w-0 flex-1 break-words text-lg font-bold uppercase leading-[1.1] tracking-tight text-gray-900 sm:text-xl md:text-2xl">
                  {project.name}
                </h2>
                <PosterFramePattern project={project} />
              </div>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <span className="max-w-full truncate rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-blue-600">
                  Projekt
                </span>
                <span className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-gray-500">
                  {projectHasReadyVariant(project) ? "Video klar" : "Mangler upload"}
                </span>
              </div>
            </div>

            <div className="relative z-10 grid w-full grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3 lg:w-auto lg:min-w-[460px] xl:grid-cols-[auto_auto_auto_auto]">
              <button
                onClick={() => setShowEmbedId(project.id)}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-transparent bg-gray-50 px-5 py-3 text-[10px] font-black uppercase tracking-widest text-gray-700 transition hover:border-gray-200 hover:bg-gray-100 active:scale-95 sm:min-w-[170px]"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="h-4 w-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5" />
                </svg>
                Kopiér embed-kode
              </button>

              <Link
                href={`/admin/embed/${project.id}`}
                className="w-full rounded-xl border border-transparent bg-blue-50 px-5 py-3 text-center text-[10px] font-black uppercase tracking-widest text-blue-600 transition hover:border-blue-200 hover:bg-blue-100 active:scale-95 sm:min-w-[120px]"
              >
                Rediger
              </Link>

              <button
                onClick={() => setPreviewId(project.id)}
                className="w-full rounded-xl bg-black px-5 py-3 text-center text-[10px] font-black uppercase tracking-widest text-white shadow-lg shadow-black/10 transition hover:bg-gray-800 active:scale-95 sm:min-w-[90px]"
              >
                Vis
              </button>

              <button
                onClick={() => handleDelete(project.id, project.name)}
                disabled={isDeleting === project.id}
                className="flex w-full items-center justify-center rounded-xl border border-transparent p-3 text-gray-300 transition hover:border-red-100 hover:bg-red-50 hover:text-red-500 active:scale-90 sm:w-auto"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-5 w-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-1.851c0-1.03-.784-1.913-1.812-1.947a45.108 45.108 0 0 0-3.322 0c-1.028.034-1.812 0.917-1.812 1.947v1.851m10.5 0a48.009 48.009 0 0 0-9.003 0" />
                </svg>
              </button>
            </div>
          </article>
        ))}
      </div>

      {showEmbedId ? (
        <div className="fixed inset-0 z-[9999] flex items-end justify-center p-4 sm:items-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setShowEmbedId(null)} />
          <div className="relative w-full max-w-xl rounded-2xl bg-white p-8 shadow-2xl animate-in slide-in-from-bottom-10 duration-300 sm:zoom-in md:p-10">
            <button onClick={() => setShowEmbedId(null)} className="absolute right-6 top-6 text-gray-300 transition-colors hover:text-gray-900">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="mb-8">
              <h2 className="text-2xl font-bold uppercase tracking-tight text-gray-900">Embed-kode</h2>
              <p className="mt-2 text-[10px] font-black uppercase tracking-widest text-gray-400">Integrér videoafspilleren på din platform</p>
            </div>
            <EmbedCodeGenerator
              projectId={showEmbedId}
              projectTitle={selectedProject?.name || "Video"}
              disabled={!projectHasReadyVariant(selectedProject)}
              disabledReason="Upload mindst én video på projektet, før du deler embed-koden."
            />
          </div>
        </div>
      ) : null}

      {previewId ? (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setPreviewId(null)} />
          <div className="relative z-10 aspect-video w-full max-w-5xl overflow-hidden rounded-2xl border border-white/10 bg-black shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <button onClick={() => setPreviewId(null)} className="absolute right-4 top-4 z-50 rounded-full border border-white/10 bg-black/40 p-2.5 text-white transition-all hover:bg-black/80 active:scale-90">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
            <iframe src={`/embed/${previewId}`} className="h-full w-full border-none" allow="autoplay; fullscreen" />
          </div>
        </div>
      ) : null}
    </div>
  );
}

function projectHasReadyVariant(project: ProjectListClientProps["initialProjects"][number] | null) {
  if (!project) {
    return false;
  }

  return (project.groups || []).some((group) => group.variants.some((variant) => Boolean(variant.muxPlaybackId)));
}

function PosterFramePattern({
  project,
}: {
  project: ProjectListClientProps["initialProjects"][number];
}) {
  const frames = (project.groups || [])
    .flatMap((group) => group.variants || [])
    .map((variant) => ({
      posterFrameUrl: variant.posterFrameUrl || null,
      muxPlaybackId: variant.muxPlaybackId,
    }))
    .filter((item) => Boolean(item.posterFrameUrl || item.muxPlaybackId));

  const unique = Array.from(new Map(frames.map((item) => [item.posterFrameUrl || item.muxPlaybackId || "", item])).values()).slice(0, 6);
  if (unique.length === 0) {
    return null;
  }

  return (
    <div className="relative hidden h-full min-h-[80px] w-[120px] shrink-0 sm:block md:min-h-[96px] md:w-[148px]">
      {unique.slice(0, 5).map((item, index) => (
        <div
          key={`${item.posterFrameUrl || item.muxPlaybackId}-${index}`}
          className="absolute top-0 bottom-0 w-[56px] overflow-hidden rounded-md border border-white bg-gray-100 shadow-sm md:w-[68px]"
          style={{ left: `${index * 18}px`, zIndex: 10 + index }}
          title={`Poster ${index + 1}`}
        >
          {item.posterFrameUrl ? (
            <Image src={item.posterFrameUrl} alt="" fill unoptimized className="h-full w-full object-cover" />
          ) : item.muxPlaybackId ? (
            <Image
              src={`https://image.mux.com/${item.muxPlaybackId}/thumbnail.jpg?time=0&width=120&height=180&fit_mode=smartcrop`}
              alt=""
              fill
              className="h-full w-full object-cover"
            />
          ) : null}
        </div>
      ))}
    </div>
  );
}
