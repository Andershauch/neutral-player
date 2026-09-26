/// Vises med det samme naar man navigerer mellem admin-sider. Uden denne
/// fil viser Next.js ingenting foer den nye sides data er hentet fra
/// databasen, saa navigation kan opleves som "frosset" i op til et par
/// sekunder — se docs/saas-roadmap.md TASK-11.1 for baggrunden.
export default function AdminLoading() {
  return (
    <div className="animate-pulse space-y-6 md:space-y-7">
      <div className="space-y-2">
        <div className="h-3 w-24 rounded-full bg-gray-100" />
        <div className="h-8 w-64 rounded-xl bg-gray-100" />
      </div>

      <div className="np-card np-card-pad">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-16 rounded-xl bg-gray-100" />
          ))}
        </div>
      </div>

      <div className="np-card np-card-pad space-y-3">
        <div className="h-4 w-1/3 rounded-full bg-gray-100" />
        <div className="h-4 w-2/3 rounded-full bg-gray-100" />
        <div className="h-4 w-1/2 rounded-full bg-gray-100" />
      </div>
    </div>
  );
}
