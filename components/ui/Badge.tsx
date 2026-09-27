import type { ReactNode } from "react";

export type BadgeTone = "neutral" | "success" | "info" | "warning";

interface BadgeProps {
  tone?: BadgeTone;
  children: ReactNode;
  className?: string;
}

const TONE_CLASS: Record<BadgeTone, string> = {
  neutral: "",
  success: "np-pill-badge-success",
  info: "np-pill-badge-info",
  warning: "np-pill-badge-warning",
};

/// Foerste delte badge i appen — bygger paa .np-pill-badge (app/globals.css)
/// i stedet for at hver status-pille (fx "Klar"/"Naeste skridt") haandkoder
/// sin egen farve.
export default function Badge({ tone = "neutral", children, className = "" }: BadgeProps) {
  return <span className={["np-pill-badge", TONE_CLASS[tone], className].filter(Boolean).join(" ")}>{children}</span>;
}
