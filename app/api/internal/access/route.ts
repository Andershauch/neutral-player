import { NextResponse } from "next/server";
import { canManageInternalBranding, canManageMarketingContent, getInternalAdminContext } from "@/lib/internal-auth";

export async function GET() {
  const internalCtx = await getInternalAdminContext();
  return NextResponse.json({
    canAccessInternal: Boolean(internalCtx),
    role: internalCtx?.role ?? null,
    canManageInternalBranding: internalCtx ? canManageInternalBranding(internalCtx.role) : false,
    canManageMarketingContent: internalCtx ? canManageMarketingContent(internalCtx.role) : false,
  });
}
