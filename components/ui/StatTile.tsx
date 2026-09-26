interface StatTileProps {
  label: string;
  value: string;
  detail?: string;
  className?: string;
}

/// Generaliserer JourneyStat (EmbedEditor), Stat/StatCard (dashboard) og
/// ProfileStat (profile-siden) — samme kort, tre lokale kopier foer denne.
export default function StatTile({ label, value, detail, className = "" }: StatTileProps) {
  return (
    <div
      className={`rounded-2xl border border-gray-200 bg-white/90 px-4 py-4 shadow-[0_4px_14px_rgba(15,23,42,0.05)] ${className}`.trim()}
    >
      <p className="np-kicker">{label}</p>
      <p className="mt-1 text-2xl font-black tracking-tight text-gray-900">{value}</p>
      {detail ? <p className="mt-1 text-xs text-gray-500">{detail}</p> : null}
    </div>
  );
}
