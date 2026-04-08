import { Suspense } from "react";
import PublicSiteHeader from "@/components/public/PublicSiteHeader";
import VerifyEmailClient from "@/components/public/VerifyEmailClient";

export const revalidate = 300;

export default function VerifyEmailPage() {
  return (
    <main className="np-default-theme np-page-shell">
      <div className="np-page-wrap np-page-stack">
        <PublicSiteHeader />
        <div className="np-form-shell">
          <Suspense
            fallback={<div className="np-form-card text-center text-sm text-gray-500">Indlæser verificering...</div>}
          >
            <VerifyEmailClient />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
