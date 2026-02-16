"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  userId: string;
  userName: string; // Tilføjet for bedre feedback og logning
}

export default function DeleteUserButton({ userId, userName }: Props) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`Er du helt sikker på, at du vil slette brugeren "${userName}"? Handlingen kan ikke fortrydes.`)) {
      return;
    }

    setIsDeleting(true);
    
    try {
      // RETTELSE: Vi kalder nu den specifikke bruger-rute direkte
      const res = await fetch(`/api/users/${userId}`, { 
        method: "DELETE" 
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Kunne ikke slette bruger");
      }

      // Succes! Opdater siden
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Ukendt fejl";
      alert(message);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <button 
      onClick={handleDelete} 
      disabled={isDeleting}
      className={`
        text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl transition-all
        ${isDeleting 
          ? "bg-gray-100 text-gray-400 cursor-not-allowed" 
          : "bg-red-50 text-red-600 hover:bg-red-600 hover:text-white active:scale-95"
        }
      `}
    >
      {isDeleting ? "Sletter..." : "Slet bruger"}
    </button>
  );
}
