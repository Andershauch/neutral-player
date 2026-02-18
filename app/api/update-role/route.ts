import { NextResponse } from "next/server";

export async function PUT() {
  return NextResponse.json(
    { error: "Legacy endpoint deaktiveret. Brug /api/users/[id] i stedet." },
    { status: 410 }
  );
}
