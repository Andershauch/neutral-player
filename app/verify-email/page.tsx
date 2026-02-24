import VerifyEmailClient from "@/components/public/VerifyEmailClient";
import { Suspense } from "react";

export const revalidate = 300;

export default function VerifyEmailPage() {
  return (
    <main className="min-h-screen bg-gray-50 px-4 py-12 md:py-16 flex items-center justify-center">
      <Suspense fallback={<div className="max-w-md w-full bg-white border border-gray-100 rounded-[2rem] p-8 text-sm text-gray-500 text-center">Indlæser verificering...</div>}>
        <VerifyEmailClient />
      </Suspense>
    </main>
  );
}
