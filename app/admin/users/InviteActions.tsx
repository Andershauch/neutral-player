"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface InviteActionsProps {
  inviteId: string;
  inviteEmail: string;
}

export default function InviteActions({ inviteId, inviteEmail }: InviteActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<"resend" | "cancel" | null>(null);

  const handleResend = async () => {
    setLoading("resend");
    try {
      const res = await fetch(`/api/users/invite/${inviteId}`, { method: "POST" });
      const data = (await res.json()) as {
        error?: string;
        emailSent?: boolean;
        inviteUrl?: string;
      };

      if (!res.ok) {
        throw new Error(data.error || "Kunne ikke gensende invitation.");
      }

      if (!data.emailSent && data.inviteUrl) {
        await navigator.clipboard.writeText(data.inviteUrl);
        alert("Email er ikke sat op endnu. Invitationslink er kopieret til udklipsholderen.");
      }

      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Ukendt fejl";
      alert(message);
    } finally {
      setLoading(null);
    }
  };

  const handleCancel = async () => {
    const confirmed = confirm(`Vil du annullere invitationen til ${inviteEmail}?`);
    if (!confirmed) return;

    setLoading("cancel");
    try {
      const res = await fetch(`/api/users/invite/${inviteId}`, { method: "DELETE" });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        throw new Error(data.error || "Kunne ikke annullere invitation.");
      }
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Ukendt fejl";
      alert(message);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="flex justify-end gap-2">
      <button
        type="button"
        onClick={handleResend}
        disabled={loading !== null}
        className="np-btn-ghost px-3 py-2 disabled:opacity-50"
      >
        {loading === "resend" ? "Sender..." : "Gensend"}
      </button>
      <button
        type="button"
        onClick={handleCancel}
        disabled={loading !== null}
        className="text-[10px] font-black uppercase tracking-widest px-3 py-2 rounded-xl bg-red-50 text-red-700 hover:bg-red-600 hover:text-white disabled:opacity-50 transition-all"
      >
        {loading === "cancel" ? "Annullerer..." : "Annuller"}
      </button>
    </div>
  );
}
