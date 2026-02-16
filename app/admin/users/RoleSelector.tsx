"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  userId: string;
  currentRole: string;
  currentUserEmail: string | null | undefined;
  targetUserEmail: string | null;
}

export default function RoleSelector({ userId, currentRole, currentUserEmail, targetUserEmail }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState(currentRole);

  const isMe = currentUserEmail === targetUserEmail;

  const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newRole = e.target.value;
    
    if (isMe && newRole !== "admin") {
        if(!confirm("ADVARSEL: Du er ved at fjerne dine egne administrator-rettigheder. Du vil miste adgangen til denne side. Er du sikker?")) {
            e.target.value = role; 
            return;
        }
    }

    setLoading(true);
    // Vi fjerner setRole(newRole) herfra og gør det kun hvis res.ok er sandt, 
    // eller beholder den hvis du ønsker "optimistic UI". 

    try {
      // 1. RETTELSE: Brug den nye dynamiske sti /api/users/[id]
      // 2. RETTELSE: Brug PATCH i stedet for PUT
      const res = await fetch(`/api/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        // 3. RETTELSE: Send kun 'role' (din API forventer { role })
        body: JSON.stringify({ role: newRole }),
      });

      if (!res.ok) throw new Error("Fejl ved opdatering");
      
      setRole(newRole); 
      router.refresh(); 
    } catch {
      alert("Noget gik galt. Rolle blev ikke opdateret.");
      e.target.value = role; // Nulstil dropdown
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
            ${role === 'admin' ? 'bg-purple-100 text-purple-800' : ''}
            ${role === 'contributor' ? 'bg-blue-100 text-blue-800' : ''}
            ${role === 'user' ? 'bg-gray-100 text-gray-600' : ''}
        `}
      >
        <option value="admin">Administrator 👑</option>
        <option value="contributor">Bidragsyder ✏️</option>
        <option value="user">Ingen Adgang ⛔</option>
      </select>
      
      {loading && (
         <div className="absolute right-7 top-1/2 -translate-y-1/2">
            <div className="animate-spin h-3 w-3 border-2 border-blue-500 rounded-full border-t-transparent"></div>
         </div>
      )}
    </div>
  );
}
