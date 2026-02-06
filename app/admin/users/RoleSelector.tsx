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

  // Forhindrer at man fjerner sin egen admin-status ved en fejl
  const isMe = currentUserEmail === targetUserEmail;

  const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newRole = e.target.value;
    
    if (isMe && newRole !== "admin") {
        if(!confirm("ADVARSEL: Du er ved at fjerne dine egne administrator-rettigheder. Du vil miste adgangen til denne side. Er du sikker?")) {
            // Nulstil valget hvis man fortryder
            e.target.value = role; 
            return;
        }
    }

    setLoading(true);
    setRole(newRole); // Opdater visuelt med det samme

    try {
      const res = await fetch("/api/update-role", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, newRole }),
      });

      if (!res.ok) throw new Error("Fejl");
      
      router.refresh(); // Genindlæs siden for at sikre alt er synkroniseret
    } catch (error) {
      alert("Noget gik galt. Prøv igen.");
      setRole(role); // Rul tilbage ved fejl
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative">
      <select
        value={role}
        onChange={handleChange}
        disabled={loading || (isMe && role !== 'admin')} // Man kan ikke ændre sig selv hvis man ikke er admin
        className={`
            block w-full pl-3 pr-8 py-1.5 text-xs font-semibold rounded-full border-0 focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-sm
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
         <div className="absolute right-2 top-2">
            <div className="animate-spin h-3 w-3 border-2 border-blue-500 rounded-full border-t-transparent"></div>
         </div>
      )}
    </div>
  );
}