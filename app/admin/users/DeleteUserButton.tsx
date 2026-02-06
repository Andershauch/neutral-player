"use client";

import { useRouter } from "next/navigation";

export default function DeleteUserButton({ userId }: { userId: string }) {
  const router = useRouter();

  const handleDelete = async () => {
    if (!confirm("Er du sikker på, at du vil slette denne bruger?")) return;
    
    await fetch(`/api/delete?type=user&id=${userId}`, { method: "DELETE" });
    router.refresh();
  };

  return (
    <button onClick={handleDelete} className="text-red-600 hover:text-red-900">Slet</button>
  );
}