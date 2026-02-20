"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface WorkspaceSetupCardProps {
  initialName: string;
  email: string;
  emailVerified: boolean;
}

export default function WorkspaceSetupCard({
  initialName,
  email,
  emailVerified,
}: WorkspaceSetupCardProps) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [saving, setSaving] = useState(false);
  const [sendingVerification, setSendingVerification] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verifyMessage, setVerifyMessage] = useState<string | null>(null);
  const [fallbackVerifyUrl, setFallbackVerifyUrl] = useState<string | null>(null);

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

  const sendVerification = async () => {
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
        setVerifyMessage("Verificeringsmail er sendt. Tjek din indbakke.");
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
  };

  const saveAndGo = async (target: "/pricing" | "/admin/dashboard") => {
    if (!emailVerified) {
      setError("Bekræft din email før du fortsætter.");
      return;
    }
    const ok = await saveName();
    if (!ok) return;
    router.push(target);
    router.refresh();
  };

  return (
    <div className="bg-white border border-gray-100 rounded-[2rem] p-6 md:p-10 shadow-xl shadow-blue-900/5 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tight">Sæt dit workspace op</h1>
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
              onClick={sendVerification}
              disabled={sendingVerification}
              className="px-4 py-2 rounded-xl bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 disabled:opacity-50"
            >
              {sendingVerification ? "Sender..." : "Send verificeringsmail"}
            </button>
            <button
              type="button"
              onClick={() => router.refresh()}
              className="ml-2 px-4 py-2 rounded-xl border border-gray-200 text-gray-600 text-[10px] font-black uppercase tracking-widest hover:bg-gray-50"
            >
              Jeg har verificeret
            </button>
            {verifyMessage && <p className="text-xs font-semibold text-blue-700">{verifyMessage}</p>}
            {fallbackVerifyUrl && (
              <Link href={fallbackVerifyUrl} className="text-xs font-semibold text-blue-600 hover:text-blue-700 break-all">
                {fallbackVerifyUrl}
              </Link>
            )}
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-gray-100 p-4 space-y-3">
        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Trin 2: Navngiv workspace</p>
        <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">
          Workspace-navn
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="F.eks. Neutral Agency"
          className="w-full px-4 py-3 rounded-2xl border border-gray-200 text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500"
          disabled={saving}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => saveAndGo("/pricing")}
          disabled={saving}
          className="px-4 py-3 rounded-xl bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 disabled:opacity-50 transition-all"
        >
          {saving ? "Gemmer..." : "Vælg plan"}
        </button>
        <button
          type="button"
          onClick={() => saveAndGo("/admin/dashboard")}
          disabled={saving}
          className="px-4 py-3 rounded-xl border border-gray-200 text-gray-700 text-[10px] font-black uppercase tracking-widest hover:bg-gray-50 disabled:opacity-50 transition-all"
        >
          {saving ? "Gemmer..." : "Fortsæt til dashboard"}
        </button>
      </div>

      <div className="text-center">
        <Link href="/pricing" className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-600">
          Spring over for nu
        </Link>
      </div>

      {error && <p className="text-xs font-semibold text-red-600 text-center">{error}</p>}
    </div>
  );
}
