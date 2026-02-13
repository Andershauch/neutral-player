import { PrismaClient } from "@prisma/client";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import MuxPlayerClient from "@/components/player/MuxPlayerClient";

const prisma = new PrismaClient();
export const dynamic = "force-dynamic";

export default async function EmbedPage({ 
  params,
  searchParams 
}: { 
  params: Promise<{ id: string }>,
  searchParams: Promise<{ v?: string }>
}) {
  // 1. Unwrapping af asynkone parametre (Next.js 15+ standard)
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const id = resolvedParams.id;
  const variantId = resolvedSearchParams.v;

  // 2. Hent projektet med alle relationer
  const project = await prisma.embed.findUnique({
    where: { id: id },
    include: { 
      groups: { 
        include: { 
          variants: true 
        } 
      } 
    },
  });

  if (!project) notFound();

  // 3. SIKKERHED: DOMAIN WHITELISTING
  const headerList = await headers();
  const referer = headerList.get("referer");
  
  if (project.allowedDomains && project.allowedDomains !== "*") {
    const allowed = project.allowedDomains.split(",").map(d => d.trim());
    let currentDomain = "";
    try {
      currentDomain = referer ? new URL(referer).hostname : "";
    } catch (e) {
      currentDomain = "";
    }
    
    // Tillad localhost og 127.0.0.1 altid til test-formål
    const isLocal = currentDomain === "localhost" || currentDomain === "127.0.0.1";

    if (currentDomain && !allowed.includes(currentDomain) && !isLocal) {
      return (
        <div style={{ color: 'white', background: '#000', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', fontFamily: 'sans-serif', padding: '20px' }}>
          <div>
            <p style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' }}>Adgang nægtet</p>
            <p style={{ fontSize: '14px', color: '#666' }}>Dette domæne ({currentDomain}) er ikke godkendt til visning.</p>
          </div>
        </div>
      );
    }
  }

  // 4. Find den valgte video (variant)
  const allVariants = project.groups.flatMap(g => g.variants);
  const selectedVariant = variantId 
    ? allVariants.find(v => v.id === variantId) 
    : allVariants[0];

  // VIGTIGT: Vi bruger KUN muxPlaybackId til MuxPlayer. 
  // muxUploadId er kun til internt brug og kan ikke afspilles.
  const playbackId = selectedVariant?.muxPlaybackId;

  return (
    <div style={{ margin: 0, padding: 0, width: '100vw', height: '100vh', backgroundColor: '#000', color: '#fff', fontFamily: 'sans-serif' }}>
      <style>{`
        body { margin: 0; overflow: hidden; background: #000; }
        .wrapper { display: flex; flex-direction: column; height: 100vh; }
        .video-box { flex: 1; position: relative; background: #000; display: flex; align-items: center; justify-content: center; }
        .menu { background: #111; padding: 12px; display: flex; gap: 8px; overflow-x: auto; border-top: 1px solid #222; }
        .btn { padding: 6px 12px; background: #333; border-radius: 4px; text-decoration: none; color: #fff; font-size: 11px; white-space: nowrap; font-weight: bold; text-transform: uppercase; transition: background 0.2s; }
        .btn:hover { background: #444; }
        .btn.active { background: #2563eb; }
        .loader-container { text-align: center; padding: 20px; }
        .spinner { width: 30px; height: 30px; border: 3px solid #333; border-top: 3px solid #2563eb; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 15px; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      `}</style>

      <div className="wrapper">
        <div className="video-box">
          {playbackId ? (
            <MuxPlayerClient 
              playbackId={playbackId}
              title={selectedVariant?.title || project.name}
              poster={project.thumbnailUrl || ""}
              variantId={selectedVariant?.id || ""}
            />
          ) : selectedVariant?.dreamBrokerUrl ? (
             <iframe 
                src={selectedVariant.dreamBrokerUrl} 
                style={{ width: '100%', height: '100%', border: 'none' }} 
                allow="autoplay; fullscreen"
                allowFullScreen 
             />
          ) : (
            <div className="loader-container">
              <div className="spinner"></div>
              <p style={{ color: '#666', fontSize: '13px', maxWidth: '250px', lineHeight: '1.5' }}>
                {selectedVariant?.muxUploadId 
                  ? "Videoen klargøres hos Mux... Prøv at genindlæse om et øjeblik." 
                  : "Ingen video er tilknyttet denne version endnu."}
              </p>
            </div>
          )}
        </div>

        {/* Custom menu til skift af sprog/versioner */}
        {allVariants.length > 1 && (
          <div className="menu">
            {allVariants.map((v) => (
              <a 
                key={v.id} 
                href={`?v=${v.id}`} 
                className={`btn ${selectedVariant?.id === v.id ? 'active' : ''}`}
              >
                {v.title || v.lang.toUpperCase()}
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}