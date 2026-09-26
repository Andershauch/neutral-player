import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/// Offentligt endpoint: den faktiske embed-afspiller på kundens website
/// henter kundens uploadede .vtt-fil herfra som et <track src>. Der er ingen
/// adgangskontrol her, ligesom videoen og posterframen i forvejen er
/// offentlige, naar embeddet er det.
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string; languageCode: string }> }
) {
  const { id: variantId, languageCode: rawLanguageCode } = await params;
  const languageCode = rawLanguageCode.replace(/\.vtt$/i, "").trim().toLowerCase();

  const subtitle = await prisma.variantSubtitle.findUnique({
    where: { variantId_languageCode: { variantId, languageCode } },
    select: { source: true, vttContent: true },
  });

  if (!subtitle || subtitle.source !== "uploaded" || !subtitle.vttContent) {
    return NextResponse.json({ error: "Underteksterne blev ikke fundet." }, { status: 404 });
  }

  return new NextResponse(subtitle.vttContent, {
    status: 200,
    headers: {
      "Content-Type": "text/vtt; charset=utf-8",
      "Cache-Control": "public, max-age=300",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
