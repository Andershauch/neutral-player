import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function DELETE() {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role;

  if (!session || role !== "admin") {
    return NextResponse.json({ error: "Ingen adgang" }, { status: 403 });
  }

  return NextResponse.json(
    { error: "Legacy endpoint deaktiveret. Brug /api/embeds/[id], /api/users/[id] eller /api/variants/[id]." },
    { status: 410 }
  );
}
