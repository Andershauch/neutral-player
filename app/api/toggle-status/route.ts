import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function PUT() {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role;

  if (!session || (role !== "admin" && role !== "contributor")) {
    return NextResponse.json({ error: "Ingen adgang" }, { status: 403 });
  }

  return NextResponse.json(
    { error: "isActive er ikke understoettet i nuvaerende schema." },
    { status: 400 }
  );
}
