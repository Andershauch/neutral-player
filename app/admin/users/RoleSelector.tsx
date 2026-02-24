"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  userId: string;
  currentRole: string;
  currentUserEmail: string | null | undefined;
  targetUserEmail: string | null;
  canAssignOwner: boolean;
}

export default function RoleSelector({ userId, currentRole, currentUserEmail, targetUserEmail, canAssignOwner }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState(currentRole);

  const isMe = currentUserEmail === targetUserEmail;

  const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newRole = e.target.value;

    if (newRole === "owner" && !canAssignOwner) {
      alert("Kun en ejer kan give ejer-rolle.");
      e.target.value = role;
      return;
    }

    if (isMe && newRole !== "owner") {
      if (!confirm("Advarsel: Du er ved at fjerne din egen ejer-rolle. Du kan miste adgangen til denne side. Vil du fortsætte?")) {
        e.target.value = role;
        return;
      }
    }

    setLoading(true);

    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });

      if (!res.ok) throw new Error("Kunne ikke opdatere rollen.");

      setRole(newRole);
      router.refresh();
    } catch {
      alert("Noget gik galt. Rollen blev ikke opdateret.");
      e.target.value = role;
      setRole(role);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative">
      <select
        value={role}
        onChange={handleChange}
        disabled={loading}
        className={`
          block w-full pl-3 pr-8 py-1.5 text-xs font-semibold rounded-full border-0 focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-sm transition-colors
          ${role === "owner" ? "bg-amber-100 text-amber-800" : ""}
          ${role === "admin" ? "bg-blue-100 text-blue-800" : ""}
          ${role === "editor" ? "bg-emerald-100 text-emerald-800" : ""}
          ${role === "viewer" ? "bg-gray-100 text-gray-600" : ""}
        `}
      >
        {canAssignOwner && <option value="owner">Ejer</option>}
        <option value="admin">Administrator</option>
        <option value="editor">Editor</option>
        <option value="viewer">Læser</option>
      </select>

      {loading && (
        <div className="absolute right-7 top-1/2 -translate-y-1/2">
          <div className="animate-spin h-3 w-3 border-2 border-blue-500 rounded-full border-t-transparent"></div>
        </div>
      )}
    </div>
  );
}
