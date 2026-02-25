import { NextResponse } from "next/server";

export async function PUT() {
  return NextResponse.json(
    { error: "Legacy endpoint deaktiveret. isActive er ikke understøttet i nuværende schema." },
    { status: 410 }
  );
}
