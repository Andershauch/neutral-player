import VerifyEmailClient from "@/components/public/VerifyEmailClient";
import { Suspense } from "react";

export const revalidate = 300;

export default function VerifyEmailPage() {
  return (
    <main className="np-default-theme np-form-shell">
      <Suspense fallback={<div className="np-form-card text-sm text-gray-500 text-center">Indlaeser verificering...</div>}>
        <VerifyEmailClient />
      </Suspense>
    </main>
  );
}
