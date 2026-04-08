import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { canManageMarketingContent, getInternalAdminContext } from "@/lib/internal-auth";
import {
  createDataUrlFromBytes,
  createMarketingAssetKey,
  describeAspectRatio,
  isAllowedMarketingImageMimeType,
  MARKETING_ASSET_FALLBACK_URL,
  MARKETING_MAX_IMAGE_BYTES,
} from "@/lib/marketing-assets";
import { getRequestIdFromRequest, logApiError, logApiInfo, logApiWarn } from "@/lib/observability";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const requestId = getRequestIdFromRequest(req);
  try {
    const internalCtx = await getInternalAdminContext();
    if (!internalCtx) {
      return NextResponse.json({ error: "Ingen adgang" }, { status: 403 });
    }
    if (!canManageMarketingContent(internalCtx.role)) {
      return NextResponse.json({ error: "Kun np_super_admin kan uploade marketing-assets." }, { status: 403 });
    }

    const formData = await req.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      logApiWarn(req, "Internal marketing asset upload rejected without file", {
        area: "internal-marketing-assets",
        requestId,
      });
      return NextResponse.json({ error: "Du skal vælge en billedfil." }, { status: 400 });
    }
    if (!isAllowedMarketingImageMimeType(file.type)) {
      logApiWarn(req, "Internal marketing asset upload rejected due to mime type", {
        area: "internal-marketing-assets",
        requestId,
        mimeType: file.type,
      });
      return NextResponse.json({ error: "Kun JPEG, PNG, WebP, AVIF og GIF understøttes i v1." }, { status: 400 });
    }
    if (file.size <= 0 || file.size > MARKETING_MAX_IMAGE_BYTES) {
      logApiWarn(req, "Internal marketing asset upload rejected due to file size", {
        area: "internal-marketing-assets",
        requestId,
        fileSizeBytes: file.size,
      });
      return NextResponse.json(
        { error: `Filen skal være mindre end ${Math.round(MARKETING_MAX_IMAGE_BYTES / 1024 / 1024)} MB.` },
        { status: 400 }
      );
    }

    const title = readOptionalString(formData.get("title"), 120);
    const altText = readOptionalString(formData.get("altText"), 160);
    const width = readOptionalInt(formData.get("width"));
    const height = readOptionalInt(formData.get("height"));
    const suggestedKey = readOptionalString(formData.get("assetKey"), 120);
    const aspectRatioLabel = describeAspectRatio(width, height);

    if (!altText) {
      logApiWarn(req, "Internal marketing asset upload rejected without alt text", {
        area: "internal-marketing-assets",
        requestId,
        fileName: file.name,
      });
      return NextResponse.json({ error: "Alt-tekst mangler." }, { status: 400 });
    }

    const bytes = new Uint8Array(await file.arrayBuffer());
    const assetKey = createMarketingAssetKey({
      fileName: file.name,
      title: suggestedKey || title || file.name,
      suffix: Math.random().toString(36).slice(2, 8),
    });

    const dataUrl = createDataUrlFromBytes(bytes, file.type);
    const asset = await prisma.marketingAsset.create({
      data: {
        key: assetKey,
        kind: "image",
        fileName: file.name,
        storageKey: assetKey,
        url: dataUrl,
        mimeType: file.type,
        altText,
        title: title || null,
        width,
        height,
        uploadedByUserId: internalCtx.userId,
        metadata: {
          fileSizeBytes: file.size,
          aspectRatioLabel,
          fallbackUrl: MARKETING_ASSET_FALLBACK_URL,
        } as Prisma.InputJsonValue,
      },
      select: {
        id: true,
        key: true,
        kind: true,
        title: true,
        altText: true,
        url: true,
        width: true,
        height: true,
        updatedAt: true,
        metadata: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: internalCtx.userId,
        userName: internalCtx.email,
        action: "INTERNAL_MARKETING_ASSET_UPLOADED",
        target: `${asset.key} (${file.name})`,
      },
    });

    logApiInfo(req, "Internal marketing asset uploaded", {
      area: "internal-marketing-assets",
      requestId,
      actorRole: internalCtx.role,
      assetKey: asset.key,
      mimeType: file.type,
      fileSizeBytes: file.size,
    });

    return NextResponse.json({ ok: true, asset, requestId });
  } catch (error) {
    logApiError(req, "Internal marketing asset upload failed", error, { area: "internal-marketing-assets", requestId });
    const message = error instanceof Error ? error.message : "Ukendt fejl";
    return NextResponse.json({ error: message, requestId }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const requestId = getRequestIdFromRequest(req);
  try {
    const internalCtx = await getInternalAdminContext();
    if (!internalCtx) {
      return NextResponse.json({ error: "Ingen adgang" }, { status: 403 });
    }

    const assets = await prisma.marketingAsset.findMany({
      orderBy: [{ updatedAt: "desc" }],
      take: 50,
      select: {
        id: true,
        key: true,
        kind: true,
        title: true,
        altText: true,
        url: true,
        width: true,
        height: true,
        updatedAt: true,
        metadata: true,
      },
    });

    return NextResponse.json({
      assets,
      fallbackUrl: MARKETING_ASSET_FALLBACK_URL,
      canManageMarketingContent: canManageMarketingContent(internalCtx.role),
      requestId,
    });
  } catch (error) {
    logApiError(req, "Internal marketing assets read failed", error, { area: "internal-marketing-assets", requestId });
    const message = error instanceof Error ? error.message : "Ukendt fejl";
    return NextResponse.json({ error: message, requestId }, { status: 500 });
  }
}

function readOptionalString(value: FormDataEntryValue | null, maxLength: number): string {
  if (typeof value !== "string") {
    return "";
  }
  return value.trim().slice(0, maxLength);
}

function readOptionalInt(value: FormDataEntryValue | null): number | null {
  if (typeof value !== "string" || !value.trim()) {
    return null;
  }

  const nextValue = Number.parseInt(value, 10);
  return Number.isFinite(nextValue) && nextValue > 0 ? nextValue : null;
}
