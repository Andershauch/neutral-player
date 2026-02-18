import { NextResponse } from "next/server";

export async function DELETE() {
  return NextResponse.json(
    { error: "Legacy endpoint deaktiveret. Brug /api/embeds/[id], /api/users/[id] eller /api/variants/[id]." },
    { status: 410 }
  );
}
