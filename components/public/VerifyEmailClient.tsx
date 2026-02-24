"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

interface VerifyEmailClientProps {
  token?: string;
}

export default function VerifyEmailClient({ token }: VerifyEmailClientProps) {
  const searchParams = useSearchParams();
  const resolvedToken = token ?? searchParams.get("token") ?? "";
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!resolvedToken) {
      setStatus("error");
      setError("Verificeringslink mangler.");
      return;
    }

    void (async () => {
      try {
        const res = await fetch("/api/email/verification/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: resolvedToken }),
        });
        const data = (await res.json()) as { error?: string };
        if (!res.ok) {
          throw new Error(data.error || "Kunne ikke bekræfte email.");
        }
        setStatus("success");
      } catch (e) {
        const message = e instanceof Error ? e.message : "Ukendt fejl";
        setError(message);
        setStatus("error");
      }
    })();
  }, [resolvedToken]);

  return (
    <div className="max-w-md w-full bg-white border border-gray-100 rounded-[2rem] p-8 shadow-xl shadow-blue-900/5 space-y-5">
      <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tight text-center">Bekræft email</h1>
      {status === "loading" && (
        <p className="text-sm text-gray-500 text-center">Bekræfter din email...</p>
      )}
      {status === "success" && (
        <div className="space-y-4">
          <p className="text-sm text-emerald-700 text-center font-semibold">
            Din email er bekræftet. Du kan nu fortsætte setup.
          </p>
          <Link
            href="/setup/workspace"
            className="block text-center px-4 py-3 rounded-xl bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-blue-700"
          >
            Fortsæt til setup
          </Link>
        </div>
      )}
      {status === "error" && (
        <div className="space-y-4">
          <p className="text-sm text-red-600 text-center font-semibold">{error || "Linket er ugyldigt."}</p>
          <Link
            href="/setup/workspace"
            className="block text-center px-4 py-3 rounded-xl border border-gray-200 text-gray-700 text-[10px] font-black uppercase tracking-widest hover:bg-gray-50"
          >
            Tilbage til setup
          </Link>
        </div>
      )}
    </div>
  );
}
