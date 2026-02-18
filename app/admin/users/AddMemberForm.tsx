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

      const data = (await res.json()) as { error?: string; emailSent?: boolean; inviteUrl?: string };
      if (!res.ok) {
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

  return (
    <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-6">
      <h2 className="text-sm font-black text-gray-900 uppercase tracking-widest">Tilføj medlem</h2>
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
          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-3 rounded-xl bg-blue-600 text-white text-[11px] font-black uppercase tracking-widest hover:bg-blue-700 disabled:opacity-50 transition"
          >
            {loading ? "Sender..." : "Send invitation"}
          </button>
        </div>
      </form>

      {message && <p className="mt-3 text-xs font-semibold text-emerald-700">{message}</p>}
      {error && <p className="mt-3 text-xs font-semibold text-red-600">{error}</p>}
      {inviteUrl && (
        <div className="mt-3 p-3 bg-blue-50 border border-blue-100 rounded-xl">
          <p className="text-[11px] text-blue-900 font-semibold break-all">{inviteUrl}</p>
          <button
            type="button"
            onClick={() => navigator.clipboard.writeText(inviteUrl)}
            className="mt-2 px-3 py-2 rounded-lg bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest"
          >
            Kopiér invitationslink
          </button>
        </div>
      )}
    </div>
  );
}
