"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface AddMemberFormProps {
  canAssignOwner: boolean;
}

export default function AddMemberForm({ canAssignOwner }: AddMemberFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"admin" | "editor" | "viewer" | "owner">("viewer");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [upgrading, setUpgrading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    setInviteUrl(null);

    try {
      const res = await fetch("/api/users/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role }),
      });

      const data = (await res.json()) as { error?: string; code?: string; emailSent?: boolean; inviteUrl?: string };
      if (!res.ok) {
        if (data.code === "UPGRADE_REQUIRED") {
          throw new Error(data.error || "Plan-grænse nået.");
        }
        throw new Error(data.error || "Kunne ikke sende invitation.");
      }

      setMessage(
        data.emailSent
          ? "Invitationen er sendt på email."
          : "Invitationen er oprettet. Kopiér linket nedenfor og send det til brugeren."
      );
      setInviteUrl(data.inviteUrl || null);
      setEmail("");
      setRole("viewer");
      router.refresh();
    } catch (err) {
      const text = err instanceof Error ? err.message : "Ukendt fejl";
      setError(text);
    } finally {
      setLoading(false);
    }
  };

  const startUpgrade = async () => {
    setUpgrading(true);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan: "pro_monthly",
          returnTo: "/admin/dashboard",
          cancelReturnTo: "/admin/dashboard",
        }),
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        throw new Error(data.error || "Kunne ikke starte checkout.");
      }
      window.location.assign(data.url);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Ukendt fejl";
      setError(message);
      setUpgrading(false);
    }
  };

  return (
    <div className="np-card p-6">
      <h2 className="text-sm font-bold text-gray-900 uppercase tracking-widest">Tilføj medlem</h2>
      <p className="text-xs text-gray-500 mt-1">Indtast email og vælg adgangsrolle.</p>

      <form className="mt-4 grid grid-cols-1 md:grid-cols-12 gap-3 items-end" onSubmit={handleSubmit}>
        <div className="md:col-span-6">
          <label className="block text-[10px] font-black uppercase text-gray-400 mb-1">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="person@firma.dk"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="md:col-span-3">
          <label className="block text-[10px] font-black uppercase text-gray-400 mb-1">Rolle</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as "admin" | "editor" | "viewer" | "owner")}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500"
          >
            {canAssignOwner && <option value="owner">Ejer</option>}
            <option value="admin">Administrator</option>
            <option value="editor">Editor</option>
            <option value="viewer">Læser</option>
          </select>
        </div>

        <div className="md:col-span-3">
          <button type="submit" disabled={loading} className="np-btn-primary w-full px-4 py-3 disabled:opacity-50">
            {loading ? "Sender..." : "Send invitation"}
          </button>
        </div>
      </form>

      {message && <p className="mt-3 text-xs font-semibold text-emerald-700">{message}</p>}

      {error && (
        <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 space-y-2">
          <p className="text-xs font-semibold text-amber-800">{error}</p>
          {error.toLowerCase().includes("plan-grænse") && (
            <button
              type="button"
              onClick={startUpgrade}
              disabled={upgrading}
              className="np-btn-primary px-3 py-2 disabled:opacity-50"
            >
              {upgrading ? "Åbner checkout..." : "Opgradér nu"}
            </button>
          )}
        </div>
      )}

      {inviteUrl && (
        <div className="mt-3 p-3 bg-blue-50 border border-blue-100 rounded-xl">
          <p className="text-[11px] text-blue-900 font-semibold break-all">{inviteUrl}</p>
          <button
            type="button"
            onClick={() => navigator.clipboard.writeText(inviteUrl)}
            className="mt-2 np-btn-primary px-3 py-2"
          >
            Kopiér invitationslink
          </button>
        </div>
      )}
    </div>
  );
}
