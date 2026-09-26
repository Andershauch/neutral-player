import type { ReactNode } from "react";

type CardTone = "default" | "muted";

interface CardProps {
  tone?: CardTone;
  padded?: boolean;
  className?: string;
  id?: string;
  children: ReactNode;
}

/// Tynd wrapper om de eksisterende .np-card/.np-card-muted klasser
/// (app/globals.css), saa vi ikke bliver ved med at haandkode
/// "rounded-2xl border border-gray-100 bg-gray-50..." per fil.
export default function Card({ tone = "default", padded = true, className = "", id, children }: CardProps) {
  const toneClass = tone === "muted" ? "np-card-muted" : "np-card";
  return (
    <div id={id} className={[toneClass, padded ? "np-card-pad" : "", className].filter(Boolean).join(" ")}>
      {children}
    </div>
  );
}
