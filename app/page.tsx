"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Tving brugeren væk med det samme
    router.replace("/admin/login");
  }, [router]);

  // Vis ingenting imens
  return null;
}