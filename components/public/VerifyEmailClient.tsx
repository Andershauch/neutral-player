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
    <div className="np-form-layout">
      <aside className="np-form-aside">
        <div className="space-y-4">
          <p className="np-form-kicker">Verificér email</p>
          <h1 className="np-form-title">Bekræft adressen, og fortsæt direkte mod setup.</h1>
          <p className="np-form-copy">
            Det her trin skal være tydeligt og roligt. Når email er bekræftet, skal du hurtigt videre til workspace
            og første projekt.
          </p>
        </div>

        <div className="np-section-card-muted">
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-gray-500">Det sker bagefter</p>
          <ul className="mt-4 np-system-list">
            <li>Du fortsætter til workspace setup uden at miste fremdrift.</li>
            <li>Du kan vælge plan eller gå direkte mod dashboard afhængigt af flowet.</li>
            <li>Hvis linket fejler, får du stadig en klar vej tilbage.</li>
          </ul>
        </div>
      </aside>

      <div className="np-form-card space-y-5">
        <div className="text-center">
          <h2 className="text-3xl font-black uppercase tracking-tighter text-gray-900">
            Neutral<span className="text-blue-600">.</span>
          </h2>
          <p className="mt-2 text-xs font-black uppercase tracking-[0.2em] text-gray-400">Bekræft email</p>
        </div>

        {status === "loading" && <p className="text-center text-sm text-gray-500">Bekræfter din email...</p>}

        {status === "success" && (
          <div className="space-y-4">
            <div className="np-status-banner np-status-banner-success">
              Din email er bekræftet. Du kan nu fortsætte setup.
            </div>
            <Link href="/setup/workspace" className="np-btn-primary block px-4 py-3 text-center">
              Fortsæt til setup
            </Link>
          </div>
        )}

        {status === "error" && (
          <div className="space-y-4">
            <div className="np-status-banner np-status-banner-error">{error || "Linket er ugyldigt."}</div>
            <Link href="/setup/workspace" className="np-btn-ghost block px-4 py-3 text-center">
              Tilbage til setup
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
