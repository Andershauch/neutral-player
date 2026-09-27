import type { ReactNode } from "react";

interface SectionHeaderProps {
  kicker?: string;
  /// Farve-override til kickeren, fx "text-blue-600" (kundeflade) eller
  /// "np-ops-accent" (internal). Uden denne bruger kickeren .np-kickers
  /// egen neutrale --muted-farve.
  kickerClassName?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  titleAs?: "h2" | "h3" | "h4";
  className?: string;
}

/// Codificerer det gentagne kicker + titel + beskrivelse-moenster, der ellers
/// er skrevet raat i naesten hver <section> paa tvaers af admin-fladen.
export default function SectionHeader({
  kicker,
  kickerClassName = "",
  title,
  description,
  actions,
  titleAs = "h2",
  className = "",
}: SectionHeaderProps) {
  const Title = titleAs;
  return (
    <div className={`flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between ${className}`.trim()}>
      <div className="space-y-2">
        {kicker ? <p className={`np-kicker ${kickerClassName}`.trim()}>{kicker}</p> : null}
        <Title className="text-xl font-black uppercase tracking-tight text-gray-900 md:text-2xl">{title}</Title>
        {description ? <p className="text-sm text-gray-600">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}
