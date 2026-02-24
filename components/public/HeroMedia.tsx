"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

type HeroVideoSource = {
  src: string;
  type: string;
  media?: string;
};

interface HeroMediaProps {
  type: "video" | "image";
  imageSrc: string;
  imageAlt: string;
  videoSources?: HeroVideoSource[];
  posterSrc?: string;
}

export default function HeroMedia({
  type,
  imageSrc,
  imageAlt,
  videoSources = [],
  posterSrc,
}: HeroMediaProps) {
  const [videoFailed, setVideoFailed] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduceMotion(mediaQuery.matches);
    sync();
    mediaQuery.addEventListener("change", sync);
    return () => mediaQuery.removeEventListener("change", sync);
  }, []);

  const shouldShowVideo = useMemo(
    () => type === "video" && !videoFailed && !reduceMotion && videoSources.length > 0,
    [type, videoFailed, reduceMotion, videoSources.length]
  );

  if (!shouldShowVideo) {
    return <Image src={imageSrc} alt={imageAlt} fill priority sizes="100vw" className="object-cover" />;
  }

  return (
    <video
      className="h-full w-full object-cover"
      autoPlay
      muted
      loop
      playsInline
      preload="metadata"
      poster={posterSrc || imageSrc}
      onError={() => setVideoFailed(true)}
    >
      {videoSources.map((source) => (
        <source key={`${source.src}-${source.type}`} src={source.src} type={source.type} media={source.media} />
      ))}
    </video>
  );
}
