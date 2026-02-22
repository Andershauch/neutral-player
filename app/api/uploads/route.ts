import Mux from "@mux/mux-node";
import { NextResponse } from "next/server";
import { canEditContent } from "@/lib/authz";
import { buildRateLimitKey, checkRateLimit, rateLimitExceededResponse } from "@/lib/rate-limit";

const mux = new Mux({
  tokenId: process.env.MUX_TOKEN_ID,
  tokenSecret: process.env.MUX_TOKEN_SECRET,
});

export async function POST(req: Request) {
  try {
    const uploadRateLimit = checkRateLimit({
      key: buildRateLimitKey("upload:create", req),
      max: 20,
      windowMs: 10 * 60 * 1000,
    });
    if (!uploadRateLimit.ok) {
      return rateLimitExceededResponse(uploadRateLimit);
    }

    const canEdit = await canEditContent();
    if (!canEdit) {
      return NextResponse.json({ error: "Ingen adgang" }, { status: 403 });
    }

    if (!process.env.MUX_TOKEN_ID || !process.env.MUX_TOKEN_SECRET) {
      return NextResponse.json({ error: "Missing Mux credentials" }, { status: 500 });
    }

    const upload = await mux.video.uploads.create({
      cors_origin: "*",
      new_asset_settings: {
        playback_policy: ["public"],
      },
    });

    return NextResponse.json({ id: upload.id, url: upload.url });
  } catch (error) {
    const details = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: "Mux upload failed", details }, { status: 500 });
  }
}
