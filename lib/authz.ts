import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export type AppRole = "admin" | "contributor" | "user";

export async function getSessionRole(): Promise<AppRole | null> {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role;
  return role === "admin" || role === "contributor" || role === "user"
    ? role
    : null;
}

export async function canEditContent(): Promise<boolean> {
  const role = await getSessionRole();
  return role === "admin" || role === "contributor";
}

export async function isAdmin(): Promise<boolean> {
  const role = await getSessionRole();
  return role === "admin";
}
