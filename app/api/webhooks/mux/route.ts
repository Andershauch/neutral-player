import { NextResponse } from "next/server";
import Mux from "@mux/mux-node";
import { prisma } from "@/lib/prisma";
import { getRequestIdFromRequest, logApiError, logApiInfo, logApiWarn } from "@/lib/observability";

interface MuxWebhookEventEnvelope {
  id?: string;
  type?: string;
  data?: Record<string, unknown>;
}

export async function POST(req: Request) {
  const requestId = getRequestIdFromRequest(req);

  try {
    const webhookSecret = process.env.MUX_WEBHOOK_SECRET;
    if (!webhookSecret) {
      logApiWarn(req, "Mux webhook misconfigured: missing MUX_WEBHOOK_SECRET");
      return NextResponse.json({ error: "MUX_WEBHOOK_SECRET mangler." }, { status: 500 });
    }

    const rawBody = await req.text();
    const mux = new Mux({ webhookSecret });

    let event: MuxWebhookEventEnvelope;
    try {
      event = mux.webhooks.unwrap(rawBody, req.headers) as unknown as MuxWebhookEventEnvelope;
    } catch (error) {
      logApiWarn(req, "Mux webhook rejected: invalid signature or payload", {
        error: error instanceof Error ? error.message : String(error),
      });
      return NextResponse.json({ error: "Invalid Mux signature or payload." }, { status: 400 });
    }

    const eventId = typeof event.id === "string" ? event.id : null;
    const eventType = typeof event.type === "string" ? event.type : null;
    if (!eventId || !eventType) {
      logApiWarn(req, "Mux webhook rejected: missing id or type");
      return NextResponse.json({ error: "Ugyldig Mux event payload." }, { status: 400 });
    }

    logApiInfo(req, "Mux webhook received", { muxEventId: eventId, muxEventType: eventType });

    const dedupe = await prisma.muxWebhookEvent.upsert({
      where: { muxEventId: eventId },
      update: {},
      create: {
        muxEventId: eventId,
        type: eventType,
      },
      select: { id: true, processedAt: true, organizationId: true },
    });

    if (dedupe.processedAt) {
      logApiInfo(req, "Mux webhook duplicate ignored", { muxEventId: eventId, muxEventType: eventType });
      return NextResponse.json({ received: true, idempotent: true });
    }

    const data =
      event.data && typeof event.data === "object" ? (event.data as Record<string, unknown>) : {};
    let resolvedOrgId = dedupe.organizationId ?? null;

    if (eventType === "video.asset.ready") {
      const assetId = typeof data.id === "string" ? data.id : null;
      const uploadId = typeof data.upload_id === "string" ? data.upload_id : null;
      const playbackIds = Array.isArray(data.playback_ids)
        ? (data.playback_ids as Array<Record<string, unknown>>)
        : [];
      const playbackId = playbackIds.length > 0 && typeof playbackIds[0]?.id === "string" ? playbackIds[0].id : null;

      if (uploadId && playbackId) {
        const variant = await prisma.variant.findFirst({
          where: { muxUploadId: uploadId },
          select: { organizationId: true },
        });
        resolvedOrgId = variant?.organizationId ?? resolvedOrgId;

        await prisma.variant.updateMany({
          where: { muxUploadId: uploadId },
          data: {
            muxPlaybackId: playbackId,
            muxAssetId: assetId,
          },
        });
      } else {
        logApiWarn(req, "Mux asset.ready payload missing uploadId or playbackId", { muxEventId: eventId });
      }
    }

    if (eventType === "video.asset.deleted") {
      const assetId = typeof data.id === "string" ? data.id : null;
      if (assetId) {
        const variant = await prisma.variant.findFirst({
          where: { muxAssetId: assetId },
          select: { organizationId: true },
        });
        resolvedOrgId = variant?.organizationId ?? resolvedOrgId;

        await prisma.variant.updateMany({
          where: { muxAssetId: assetId },
          data: {
            muxPlaybackId: null,
            muxAssetId: null,
            muxUploadId: null,
          },
        });
      } else {
        logApiWarn(req, "Mux asset.deleted payload missing asset id", { muxEventId: eventId });
      }
    }

    await prisma.muxWebhookEvent.update({
      where: { id: dedupe.id },
      data: {
        processedAt: new Date(),
        organizationId: resolvedOrgId,
      },
    });

    logApiInfo(req, "Mux webhook processed", {
      muxEventId: eventId,
      muxEventType: eventType,
      organizationId: resolvedOrgId,
    });

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    logApiError(req, "Mux webhook route crashed", error);
    return NextResponse.json({ error: "Webhook failed", requestId }, { status: 500 });
  }
}
