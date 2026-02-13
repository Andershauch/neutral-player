"use client";

import MuxPlayer from "@mux/mux-player-react";

interface MuxPlayerClientProps {
  playbackId: string;
  title: string;
  poster: string;
  variantId: string;
}

export default function MuxPlayerClient({ playbackId, title, poster, variantId }: MuxPlayerClientProps) {
  const handlePlay = () => {
    // ANALYTICS: Kalder dit API uden at forstyrre brugeren
    fetch("/api/analytics/view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ variantId }),
    }).catch((err) => console.error("Analytics fejl:", err));
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