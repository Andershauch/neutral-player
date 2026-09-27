import type { ReactNode } from "react";

type CardTone = "default" | "muted" | "section" | "section-muted";

interface CardProps {
  tone?: CardTone;
  padded?: boolean;
  className?: string;
  id?: string;
  children: ReactNode;
}

const TONE_CLASS: Record<CardTone, string> = {
  default: "np-card",
  // .np-card-muted (globals.css) kun overrider background/border-color — den
  // har bevidst ingen egen border-radius/box-shadow og skal derfor kombineres
  // med .np-card, i modsaetning til .np-section-card-muted, som er sit eget
  // fuldstaendige recipe.
  muted: "np-card np-card-muted",
  section: "np-section-card",
  "section-muted": "np-section-card-muted",
};

/// Tynd wrapper om de eksisterende .np-card/.np-card-muted/.np-section-card/
/// .np-section-card-muted klasser (app/globals.css), saa vi ikke bliver ved
/// med at haandkode "rounded-2xl border border-gray-100 bg-gray-50..." per fil.
/// "section"-tonerne haandterer selv deres egen padding (se globals.css),
/// saa `padded` gaelder kun default/muted, som bruger den separate .np-card-pad.
export default function Card({ tone = "default", padded = true, className = "", id, children }: CardProps) {
  const toneClass = TONE_CLASS[tone];
  const isSectionTone = tone === "section" || tone === "section-muted";
  return (
    <div
      id={id}
      className={[toneClass, padded && !isSectionTone ? "np-card-pad" : "", className].filter(Boolean).join(" ")}
    >
      {children}
    </div>
  );
}
