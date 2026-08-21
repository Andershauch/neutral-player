"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

interface WorkspaceSetupCardProps {
  initialName: string;
  email: string;
  emailVerified: boolean;
  /// Planen kunden valgte på pricing, båret hertil så valget ikke skal træffes igen.
  planKey?: string | null;
  planName?: string | null;
  planRequiresInvoice?: boolean;
}

export default function WorkspaceSetupCard({
  initialName,
  email,
  emailVerified,
  planKey = null,
  planName = null,
  planRequiresInvoice = false,
}: WorkspaceSetupCardProps) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [saving, setSaving] = useState(false);
  const [sendingVerification, setSendingVerification] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verifyMessage, setVerifyMessage] = useState<string | null>(null);
  const [fallbackVerifyUrl, setFallbackVerifyUrl] = useState<string | null>(null);
  const autoSentRef = useRef(false);

  const saveName = async () => {
    if (!name.trim()) {
      setError("Skriv et navn til dit workspace.");
      return false;
    }

    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/workspace", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        throw new Error(data.error || "Kunne ikke gemme workspace.");
      }
      return true;
    } catch (e) {
      const message = e instanceof Error ? e.message : "Ukendt fejl";
      setError(message);
      return false;
    } finally {
      setSaving(false);
    }
  };

  const sendVerification = useCallback(
    async (options?: { automatic?: boolean }) => {
      setSendingVerification(true);
      setVerifyMessage(null);
      setFallbackVerifyUrl(null);
      setError(null);
      try {
        const res = await fetch("/api/email/verification/send", { method: "POST" });
        const data = (await res.json()) as {
          error?: string;
          alreadyVerified?: boolean;
          sent?: boolean;
          verifyUrl?: string | null;
        };
        if (!res.ok) {
          throw new Error(data.error || "Kunne ikke sende verificeringsmail.");
        }
        if (data.alreadyVerified) {
          router.refresh();
          return;
        }
        if (data.sent) {
          setVerifyMessage(
            options?.automatic
              ? "Vi har sendt en verificeringsmail automatisk. Tjek din indbakke."
              : "Verificeringsmail er sendt. Tjek din indbakke.",
          );
        } else {
          setVerifyMessage("Email-provider er ikke sat op. Brug linket herunder til at verificere manuelt.");
          setFallbackVerifyUrl(data.verifyUrl || null);
        }
      } catch (e) {
        const message = e instanceof Error ? e.message : "Ukendt fejl";
        setError(message);
      } finally {
        setSendingVerification(false);
      }
    },
    [router],
  );

  useEffect(() => {
    if (emailVerified || autoSentRef.current) return;
    autoSentRef.current = true;
    void sendVerification({ automatic: true });
  }, [emailVerified, sendVerification]);

  const saveAndGo = async (target: string) => {
    if (!emailVerified) {
      setError("Bekræft din email før du fortsætter.");
      return;
    }
    const ok = await saveName();
    if (!ok) return;
    router.push(target);
    router.refresh();
  };

  // Ét anbefalet næste skridt. Prøveperioden kører allerede, så vejen går ind i
  // produktet — ikke tilbage til et planvalg kunden måske allerede har truffet.
  const primaryTarget = "/admin/dashboard";
  const primaryLabel = "Kom i gang";

  return (
    <div className="np-form-layout">
      <aside className="np-form-aside">
        <div className="space-y-4">
          <p className="np-form-kicker">Workspace setup</p>
          <h1 className="np-form-title">Sæt rammerne, og vælg hvordan du vil videre.</h1>
          <p className="np-form-copy">
            Dette er broen mellem oprettelse og rigtig brug. Her skal det være let at forstå rækkefølgen: verificér,
            navngiv, vælg plan eller gå videre til dashboard.
          </p>
        </div>

        <div className="np-section-card-muted">
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-gray-500">De tre trin</p>
          <ul className="mt-4 np-system-list">
            <li>Bekræft email så adgang og invitationer bliver stabile.</li>
            <li>Navngiv workspace så teamet får en tydelig base.</li>
            <li>Vælg plan eller fortsæt direkte mod dashboard, alt efter hvor langt du er.</li>
          </ul>
        </div>

        <div className="np-data-strip">
          <div className="np-data-chip">
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-gray-500">Konto</p>
            <p className="mt-2 text-sm font-semibold text-gray-900">{email || "Ingen email fundet"}</p>
          </div>
          <div className="np-data-chip">
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-gray-500">Status</p>
            <p className="mt-2 text-sm font-semibold text-gray-900">
              {emailVerified ? "Email bekræftet" : "Mangler verificering"}
            </p>
          </div>
          <div className="np-data-chip">
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-gray-500">Næste valg</p>
            <p className="mt-2 text-sm font-semibold text-gray-900">Planvalg eller dashboard, når setup er klart.</p>
          </div>
        </div>
      </aside>

      <div className="np-form-card np-form-card-wide space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-black uppercase tracking-tight text-gray-900">Sæt dit workspace op</h2>
          <p className="text-sm text-gray-500">
            Fuldfør de to sidste trin: bekræft email, navngiv workspace, og vælg derefter plan eller dashboard.
          </p>
        </div>

        <div className="rounded-2xl border border-gray-100 p-4 space-y-3">
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Trin 1: Bekræft email</p>
          <p className="text-sm text-gray-600">
            Konto: <span className="font-semibold">{email}</span>
          </p>
          {emailVerified ? (
            <p className="text-xs font-semibold text-emerald-700">Din email er bekræftet.</p>
          ) : (
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => {
                  void sendVerification();
                }}
                disabled={sendingVerification}
                className="np-btn-primary px-4 py-2 disabled:opacity-50"
              >
                {sendingVerification ? "Sender..." : "Send verificeringsmail"}
              </button>
              <button type="button" onClick={() => router.refresh()} className="ml-2 np-btn-ghost px-4 py-2">
                Jeg har verificeret
              </button>
              {verifyMessage && <p className="text-xs font-semibold text-blue-700">{verifyMessage}</p>}
              {fallbackVerifyUrl && (
                <Link href={fallbackVerifyUrl} className="break-all text-xs font-semibold text-blue-600 hover:text-blue-700">
                  {fallbackVerifyUrl}
                </Link>
              )}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-gray-100 p-4 space-y-3">
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Trin 2: Navngiv workspace</p>
          <label className="ml-1 block text-[10px] font-black uppercase tracking-widest text-gray-400">Workspace-navn</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="F.eks. Neutral Agency"
            className="np-field"
            disabled={saving}
          />
        </div>

        {planName ? (
          <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-blue-700">Jeres valg</p>
            <p className="mt-2 text-sm text-gray-700">
              I valgte <span className="font-bold">{planName}</span>.{" "}
              {planRequiresInvoice
                ? "Vi har gemt valget. I kan anmode om faktura under Plan, når I er kommet i gang."
                : "Vi har gemt valget, så I kan gennemføre betalingen under Plan, når I er klar."}
            </p>
          </div>
        ) : null}

        <div className="rounded-2xl border border-gray-100 p-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Trin 3: Kom i gang</p>
          <p className="mt-2 text-sm text-gray-600">
            Jeres prøveperiode er allerede aktiv, så I kan uploade og teste med det samme. Afspilleren viser et
            vandmærke, indtil I vælger en plan.
          </p>
          <button
            type="button"
            onClick={() => saveAndGo(primaryTarget)}
            disabled={saving}
            className="np-btn-primary mt-4 w-full px-4 py-3 disabled:opacity-50"
          >
            {saving ? "Gemmer..." : primaryLabel}
          </button>
        </div>

        <div className="text-center">
          <Link
            href="/pricing"
            className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-600"
          >
            {planKey ? "Se planerne igen" : "Se planerne først"}
          </Link>
        </div>

        {error && <p className="text-center text-xs font-semibold text-red-600">{error}</p>}
      </div>
    </div>
  );
}
