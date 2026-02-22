import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import Mux from "@mux/mux-node";
import { getOrgContextForContentEdit } from "@/lib/authz";
import { buildRateLimitKey, checkRateLimit, rateLimitExceededResponse } from "@/lib/rate-limit";

const mux = new Mux({
  tokenId: process.env.MUX_TOKEN_ID!,
  tokenSecret: process.env.MUX_TOKEN_SECRET!,
});

function normalizeAllowedDomains(input: unknown): string {
  const raw = typeof input === "string" ? input.trim() : "";
  if (!raw || raw === "*") return "*";

  const parts = raw
    .split(/[\n,]/)
    .map((entry) => entry.trim())
    .filter(Boolean);

  if (parts.length === 0) return "*";

  const cleaned = new Set<string>();
  for (const part of parts) {
    if (part === "*") return "*";
    let host = part.toLowerCase();
    host = host.replace(/^https?:\/\//, "");
    host = host.replace(/\/.*$/, "");
    host = host.replace(/[?#].*$/, "");

    if (!host) continue;
    const wildcardHostPattern = /^\*\.[a-z0-9.-]+(?::\d+)?$/;
    const hostPattern = /^[a-z0-9.-]+(?::\d+)?$/;
    const isWildcardHost = wildcardHostPattern.test(host);
    const isPlainHost = hostPattern.test(host);

    if (!isWildcardHost && !isPlainHost) {
      throw new Error(`Ugyldigt domæne: ${part}`);
    }

    if (isWildcardHost && host.split(".").length < 3) {
      throw new Error(`Ugyldigt wildcard-domæne: ${part}`);
    }

    cleaned.add(host);
  }

  return cleaned.size > 0 ? Array.from(cleaned).join(",") : "*";
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const orgCtx = await getOrgContextForContentEdit();
    if (!orgCtx) {
      return NextResponse.json({ error: "Ingen adgang" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const allowedDomains = normalizeAllowedDomains(body?.allowedDomains);

    const project = await prisma.embed.findFirst({
      where: { id, organizationId: orgCtx.orgId },
      select: { id: true, name: true },
    });

    if (!project) {
      return NextResponse.json({ error: "Projekt ikke fundet" }, { status: 404 });
    }

    const actor = await prisma.user.findUnique({
      where: { id: orgCtx.userId },
      select: { name: true, email: true },
    });

    const updated = await prisma.$transaction(async (tx) => {
      const embed = await tx.embed.update({
        where: { id: project.id },
        data: { allowedDomains },
        select: { id: true, allowedDomains: true },
      });

      await tx.auditLog.create({
        data: {
          organizationId: orgCtx.orgId,
          userId: orgCtx.userId,
          userName: actor?.name || actor?.email || null,
          action: "OPDATER_DOMAENER",
          target: `${project.name} (ID: ${project.id}) -> ${allowedDomains}`,
        },
      });

      return embed;
    });

    return NextResponse.json(updated);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Ukendt fejl";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const projectDeleteRateLimit = checkRateLimit({
      key: buildRateLimitKey("write:embed-delete", req),
      max: 20,
      windowMs: 10 * 60 * 1000,
    });
    if (!projectDeleteRateLimit.ok) {
      return rateLimitExceededResponse(projectDeleteRateLimit);
    }

    const orgCtx = await getOrgContextForContentEdit();
    if (!orgCtx) {
      return NextResponse.json({ error: "Ingen adgang" }, { status: 403 });
    }

    const { id } = await params;

    const project = await prisma.embed.findFirst({
      where: {
        id,
        organizationId: orgCtx.orgId,
      },
      include: {
        groups: {
          include: {
            variants: true,
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Projekt ikke fundet" }, { status: 404 });
    }

    const variants = project.groups.flatMap((g) => g.variants);
    for (const variant of variants) {
      if (variant.muxAssetId) {
        try {
          await mux.video.assets.delete(variant.muxAssetId);
        } catch (muxErr) {
          console.error("Mux sletning fejlede (kan ignoreres):", muxErr);
        }
      }
    }

    const actor = await prisma.user.findUnique({
      where: { id: orgCtx.userId },
      select: { name: true, email: true },
    });

    await prisma.$transaction([
      prisma.embed.delete({ where: { id: project.id } }),
      prisma.auditLog.create({
        data: {
          organizationId: orgCtx.orgId,
          userId: orgCtx.userId,
          userName: actor?.name || actor?.email || null,
          action: "SLET_PROJEKT",
          target: `${project.name} (ID: ${project.id})`,
        },
      }),
    ]);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("SLETNING FEJLEDE:", error);
    const message = error instanceof Error ? error.message : "Ukendt fejl";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
