import { NextResponse } from "next/server";

export async function PUT() {
  return NextResponse.json(
    { error: "Legacy endpoint deaktiveret. isActive er ikke understoettet i nuvaerende schema." },
    { status: 410 }
  );
}
