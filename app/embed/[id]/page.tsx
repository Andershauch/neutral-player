import { PrismaClient } from "@prisma/client";
import { notFound } from "next/navigation";
import MuxPlayer from "@mux/mux-player-react";
import { headers } from "next/headers";

const prisma = new PrismaClient();
export const dynamic = "force-dynamic";

export default async function EmbedPage({ 
  params,
  searchParams 
}: { 
  params: { id: string },
  searchParams: { v?: string } 
}) {
  const project = await prisma.embed.findUnique({
    where: { id: params.id },
    include: { groups: { include: { variants: true } } },
  });

  if (!project) notFound();

  // --- SIKKERHED: DOMAIN WHITELISTING (RETTET TIL ASYNC) ---
  const headerList = await headers(); // Tilføjet await her
  const referer = headerList.get("referer"); // Nu virker .get()
  
  if (project.allowedDomains && project.allowedDomains !== "*") {
    const allowed = project.allowedDomains.split(",").map(d => d.trim());
    
    let currentDomain = "";
    try {
      currentDomain = referer ? new URL(referer).hostname : "";
    } catch (e) {
      currentDomain = ""; // Hvis URL'en er ugyldig
    }
    
    // Hvis domænet ikke er på listen (og vi ikke er på localhost)
    if (currentDomain && !allowed.includes(currentDomain) && currentDomain !== "localhost" && currentDomain !== "127.0.0.1") {
      return (
        <div style={{ color: 'white', background: '#000', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '20px', fontFamily: 'sans-serif' }}>
          <div>
            <p style={{ fontSize: '18px', fontWeight: 'bold' }}>Adgang nægtet</p>
            <p style={{ fontSize: '14px', color: '#666' }}>Denne video er ikke godkendt til visning på: {currentDomain}</p>
          </div>
        </div>
      );
    }
  }

  const allVariants = project.groups.flatMap(g => g.variants);
  const selectedVariant = searchParams.v 
    ? allVariants.find(v => v.id === searchParams.v) 
    : allVariants[0];

  // Vi prioriterer muxPlaybackId (fra webhooks), ellers fallback til muxUploadId
  const playbackId = selectedVariant?.muxPlaybackId || selectedVariant?.muxUploadId;

  return (
    <div style={{ margin: 0, padding: 0, width: '100vw', height: '100vh', backgroundColor: '#000', color: '#fff', fontFamily: 'sans-serif' }}>
      <style>{`
        body { margin: 0; overflow: hidden; background: #000; }
        .wrapper { display: flex; flex-direction: column; height: 100vh; }
        .video-box { flex: 1; position: relative; background: #000; display: flex; align-items: center; justify-content: center; }
        .menu { background: #111; padding: 12px; display: flex; gap: 8px; overflow-x: auto; border-top: 1px solid #222; }
        .btn { padding: 6px 12px; background: #333; border-radius: 4px; text-decoration: none; color: #fff; font-size: 12px; white-space: nowrap; transition: background 0.2s; }
        .btn:hover { background: #444; }
        .btn.active { background: #2563eb; }
        .status-msg { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 15px; text-align: center; }
        .loader { width: 40px; height: 40px; border: 3px solid #333; border-top: 3px solid #2563eb; border-radius: 50%; animation: spin 1s linear infinite; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      `}</style>

      <div className="wrapper">
        <div className="video-box">
          {playbackId ? (
            <MuxPlayer
              playbackId={playbackId}
              metadataVideoTitle={selectedVariant?.title || project.name}
              poster={project.thumbnailUrl || ""}
              streamType="on-demand"
              style={{ height: '100%', width: '100%' }}
              onPlay={() => {
                // ANALYTICS: Tæl visning uden at blokere afspilleren
                fetch("/api/analytics/view", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ variantId: selectedVariant?.id }),
                }).catch(err => console.error("Analytics error:", err));
              }}
            />
          ) : (
            <div className="status-msg">
              <div className="loader"></div>
              <p style={{ color: '#aaa', fontSize: '14px' }}>Videoen klargøres...<br/>Vi er klar om et øjeblik.</p>
            </div>
          )}
        </div>

        {allVariants.length > 1 && (
          <div className="menu">
            {allVariants.map((v) => (
              <a key={v.id} href={`?v=${v.id}`} className={`btn ${selectedVariant?.id === v.id ? 'active' : ''}`}>
                {v.title || v.lang.toUpperCase()}
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}