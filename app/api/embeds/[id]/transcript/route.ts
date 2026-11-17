import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getOrgContextForContentEdit } from "@/lib/authz";
import { buildRateLimitKey, checkRateLimit, rateLimitExceededResponse } from "@/lib/rate-limit";
import {
  MAX_TRANSCRIPT_FILE_BYTES,
  parseTranscriptFile,
  splitTranscriptByLanguage,
} from "@/lib/transcript";
import { getRequestIdFromRequest, logApiError, logApiInfo } from "@/lib/observability";

type RouteContext = { params: Promise<{ id: string }> };

type OrgCtx = NonNullable<Awaited<ReturnType<typeof getOrgContextForContentEdit>>>;

/// Loads the variants a transcript upload applies to. An embed normally has one
/// group; with several groups the caller must say which one, so we never guess.
async function loadTargetVariants(embedId: string, orgId: string, groupId: string | undefined) {
  const embed = await prisma.embed.findFirst({
    where: { id: embedId, organizationId: orgId },
    select: {
      groups: {
        select: { id: true, variants: { select: { id: true, lang: true } } },
      },
    },
  });
  if (!embed) return { error: NextResponse.json({ error: "Embed blev ikke fundet." }, { status: 404 }) };

  let groups = embed.groups;
  if (groupId) {
    groups = groups.filter((g) => g.id === groupId);
    if (groups.length === 0) {
      return { error: NextResponse.json({ error: "Gruppen blev ikke fundet." }, { status: 404 }) };
    }
  } else if (groups.length > 1) {
    return {
      error: NextResponse.json(
        { error: "Embedden har flere grupper. Angiv hvilken gruppe teksten skal til (groupId)." },
        { status: 400 },
      ),
    };
  }
  return { variants: groups.flatMap((g) => g.variants) };
}

async function writeAudit(orgCtx: OrgCtx, action: string, target: string) {
  const actor = await prisma.user.findUnique({
    where: { id: orgCtx.userId },
    select: { name: true, email: true },
  });
  await prisma.auditLog.create({
    data: {
      organizationId: orgCtx.orgId,
      userId: orgCtx.userId,
      userName: actor?.name || actor?.email || null,
      action,
      target,
    },
  });
}

/// One file per embed (all languages). Distributed to the variants by language code.
export async function POST(req: Request, { params }: RouteContext) {
  const requestId = getRequestIdFromRequest(req);
  try {
    const limit = checkRateLimit({
      key: buildRateLimitKey("transcript:upload", req),
      max: 20,
      windowMs: 10 * 60 * 1000,
    });
    if (!limit.ok) return rateLimitExceededResponse(limit);

    const orgCtx = await getOrgContextForContentEdit();
    if (!orgCtx) return NextResponse.json({ error: "Ingen adgang." }, { status: 403 });

    // Cheap guard before buffering the body; the exact byte check is in parseTranscriptFile.
    const declaredLength = Number(req.headers.get("content-length") ?? 0);
    if (declaredLength > MAX_TRANSCRIPT_FILE_BYTES * 2) {
      return NextResponse.json({ error: "Filen er for stor." }, { status: 413 });
    }

    const { id: embedId } = await params;
    const body = (await req.json().catch(() => null)) as { content?: unknown; groupId?: unknown } | null;
    if (!body || typeof body.content !== "string") {
      return NextResponse.json({ error: "Filens indhold mangler." }, { status: 400 });
    }
    const groupId = typeof body.groupId === "string" && body.groupId ? body.groupId : undefined;

    const parsed = parseTranscriptFile(body.content);
    if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });

    const target = await loadTargetVariants(embedId, orgCtx.orgId, groupId);
    if (target.error) return target.error;

    const split = splitTranscriptByLanguage(parsed.languages, target.variants);
    if (split.assignments.size === 0) {
      return NextResponse.json(
        {
          error: "Ingen af sprogene i filen matcher en sprogversion i denne embed.",
          languagesWithoutVideo: split.languagesWithoutVideo,
          variantsWithoutText: split.variantsWithoutText,
        },
        { status: 400 },
      );
    }

    await prisma.$transaction(
      [...split.assignments.entries()].map(([variantId, data]) =>
        prisma.variant.update({
          where: { id: variantId },
          data: { transcript: data as unknown as Prisma.InputJsonValue },
        }),
      ),
    );

    const updatedLanguages = target.variants
      .filter((v) => split.assignments.has(v.id))
      .map((v) => v.lang);

    await writeAudit(
      orgCtx,
      "TRANSCRIPT_UPLOADED",
      `Uploadede tekstversion (${updatedLanguages.join(", ")}) på embed ${embedId}`,
    );
    logApiInfo(req, "Transcript uploaded", {
      orgId: orgCtx.orgId,
      embedId,
      variants: split.assignments.size,
    });

    return NextResponse.json({
      ok: true,
      updatedLanguages,
      languagesWithoutVideo: split.languagesWithoutVideo,
      variantsWithoutText: split.variantsWithoutText,
    });
  } catch (error) {
    logApiError(req, "Transcript upload failed", error);
    return NextResponse.json({ error: "Upload af tekstversion fejlede.", requestId }, { status: 500 });
  }
}

/// Removes the text version from every variant of the embed (or one group).
export async function DELETE(req: Request, { params }: RouteContext) {
  const requestId = getRequestIdFromRequest(req);
  try {
    const limit = checkRateLimit({
      key: buildRateLimitKey("transcript:delete", req),
      max: 20,
      windowMs: 10 * 60 * 1000,
    });
    if (!limit.ok) return rateLimitExceededResponse(limit);

    const orgCtx = await getOrgContextForContentEdit();
    if (!orgCtx) return NextResponse.json({ error: "Ingen adgang." }, { status: 403 });

    const { id: embedId } = await params;
    const groupId = new URL(req.url).searchParams.get("groupId") || undefined;

    const target = await loadTargetVariants(embedId, orgCtx.orgId, groupId);
    if (target.error) return target.error;

    const result = await prisma.variant.updateMany({
      // Variants come from an org-scoped embed; old variants may lack organizationId.
      where: { id: { in: target.variants.map((v) => v.id) } },
      data: { transcript: Prisma.DbNull },
    });

    await writeAudit(orgCtx, "TRANSCRIPT_DELETED", `Fjernede tekstversion på embed ${embedId}`);
    logApiInfo(req, "Transcript deleted", { orgId: orgCtx.orgId, embedId, variants: result.count });

    return NextResponse.json({ ok: true, removedFrom: result.count });
  } catch (error) {
    logApiError(req, "Transcript delete failed", error);
    return NextResponse.json({ error: "Kunne ikke fjerne tekstversionen.", requestId }, { status: 500 });
  }
}
