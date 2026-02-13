"use client";

import MuxPlayer from "@mux/mux-player-react";

interface MuxPlayerClientProps {
  playbackId: string;
  title: string;
  poster: string;
  variantId: string;
}

export default function MuxPlayerClient({ playbackId, title, poster, variantId }: MuxPlayerClientProps) {
  const handlePlay = async () => {
    console.log("Sender visning for variant:", variantId);
    
    try {
      const res = await fetch("/api/analytics/view", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ variantId }),
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        console.error("Analytics server-fejl:", errorData);
      } else {
        console.log("Visning registreret!");
      }
    } catch (err) {
      console.error("Analytics netværks-fejl:", err);
    }
  };

  return (
    <MuxPlayer
      playbackId={playbackId}
      metadataVideoTitle={title}
      poster={poster}
      streamType="on-demand"
      style={{ height: "100%", width: "100%" }}
      onPlay={handlePlay}
    />
  );
}