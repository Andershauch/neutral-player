import type { ReactNode } from "react";

/// Den gentagne ydre skal for public/auth-siderne (`.np-default-theme
/// np-page-shell` + `.np-page-wrap np-page-stack`, se app/globals.css), som
/// tidligere var haandskrevet identisk i 11 sidefiler. TASK-11.3.
/// Bevidst <div>, ikke <main>: <PublicSiteHeader>'s <header> er foerste
/// child her paa alle 11 sider, og et <header> mister sin implicitte
/// "banner"-landmark-rolle, naar det er et efterkommer af <main> (HTML-AAM).
/// Det er noget public-flows.spec.ts allerede reelt afhaenger af.
export default function PublicPageShell({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className="np-default-theme np-page-shell">
      <div className={["np-page-wrap np-page-stack", className].filter(Boolean).join(" ")}>{children}</div>
    </div>
  );
}
