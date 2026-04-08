import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { canManageMarketingContent, getInternalAdminContext } from "@/lib/internal-auth";
import { getDefaultMarketingContent } from "@/lib/marketing-content-defaults";
import {
  MARKETING_CONTENT_SCHEMA_VERSION,
  MARKETING_EDITOR_SECTIONS,
  validateMarketingPageContent,
  type MarketingPageContent,
} from "@/lib/marketing-content-schema";
import {
  MARKETING_PAGE_DESCRIPTIONS,
  MARKETING_PAGE_KEYS,
  MARKETING_PAGE_TITLES,
  isSupportedMarketingPageKey,
  type MarketingPageKey,
} from "@/lib/marketing-pages";
import { getMarketingRevalidationPaths } from "@/lib/marketing-routes";
import { getRequestIdFromRequest, logApiError, logApiInfo, logApiWarn } from "@/lib/observability";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const requestId = getRequestIdFromRequest(req);
  try {
    const internalCtx = await getInternalAdminContext();
    if (!internalCtx) {
      return NextResponse.json({ error: "Ingen adgang" }, { status: 403 });
    }

    const pageKey = getPageKeyFromRequest(req.url);
    const [page, assets] = await Promise.all([
      prisma.marketingPage.findUnique({
        where: { key: pageKey },
        include: {
          activeDraft: {
            select: {
              id: true,
              version: true,
              status: true,
              content: true,
              changeSummary: true,
              updatedAt: true,
              publishedAt: true,
            },
          },
          publishedVersion: {
            select: {
              id: true,
              version: true,
              status: true,
              content: true,
              changeSummary: true,
              updatedAt: true,
              publishedAt: true,
            },
          },
          versions: {
            orderBy: [{ version: "desc" }],
            take: 20,
            select: {
              id: true,
              version: true,
              status: true,
              changeSummary: true,
              updatedAt: true,
              publishedAt: true,
            },
          },
        },
      }),
      prisma.marketingAsset.findMany({
        orderBy: [{ updatedAt: "desc" }],
        take: 30,
        select: {
          id: true,
          key: true,
          kind: true,
          title: true,
          altText: true,
          url: true,
          width: true,
          height: true,
          metadata: true,
          updatedAt: true,
        },
      }),
    ]);

    const defaultContent = getDefaultMarketingContent(pageKey);
    const currentContent = (page?.activeDraft?.content as MarketingPageContent | undefined)
      ?? (page?.publishedVersion?.content as MarketingPageContent | undefined)
      ?? defaultContent;

    return NextResponse.json({
      actorRole: internalCtx.role,
      canManageMarketingContent: canManageMarketingContent(internalCtx.role),
      pages: MARKETING_PAGE_KEYS.map((key) => ({
        key,
        title: MARKETING_PAGE_TITLES[key],
        description: MARKETING_PAGE_DESCRIPTIONS[key],
      })),
      page: {
        key: pageKey,
        title: MARKETING_PAGE_TITLES[pageKey],
        description: MARKETING_PAGE_DESCRIPTIONS[pageKey],
      },
      editableSections: MARKETING_EDITOR_SECTIONS[pageKey],
      currentSource: page?.activeDraft ? "draft" : page?.publishedVersion ? "published" : "default",
      currentContent,
      defaultContent,
      draftVersion: page?.activeDraft ?? null,
      publishedVersion: page?.publishedVersion ?? null,
      versions: page?.versions ?? [],
      assets,
      requestId,
    });
  } catch (error) {
    logApiError(req, "Internal marketing content read failed", error, { area: "internal-marketing-content", requestId });
    const message = error instanceof Error ? error.message : "Ukendt fejl";
    return NextResponse.json({ error: message, requestId }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const requestId = getRequestIdFromRequest(req);
  try {
    const internalCtx = await getInternalAdminContext();
    if (!internalCtx) {
      return NextResponse.json({ error: "Ingen adgang" }, { status: 403 });
    }
    if (!canManageMarketingContent(internalCtx.role)) {
      return NextResponse.json({ error: "Kun np_super_admin kan gemme marketing drafts." }, { status: 403 });
    }

    const body = (await req.json()) as {
      pageKey?: unknown;
      content?: unknown;
      changeSummary?: unknown;
    };
    const pageKey = parsePageKey(body.pageKey);
    if (!pageKey) {
      return NextResponse.json({ error: "Ugyldig eller manglende pageKey." }, { status: 400 });
    }

    const validated = validateMarketingPageContent(pageKey, body.content);
    if (!validated.ok || !validated.value) {
      logApiWarn(req, "Internal marketing draft save rejected due to invalid payload", {
        area: "internal-marketing-content",
        requestId,
        pageKey,
        errors: validated.errors,
      });
      return NextResponse.json({ error: "Ugyldigt marketing payload.", details: validated.errors }, { status: 400 });
    }
    const nextContent = validated.value;

    const rawSummary = typeof body.changeSummary === "string" ? body.changeSummary.trim() : "";
    const changeSummary = rawSummary ? rawSummary.slice(0, 180) : null;

    const draft = await prisma.$transaction(async (tx) => {
      const pageMeta = getPageMeta(pageKey);
      let page = await tx.marketingPage.findUnique({
        where: { key: pageKey },
        select: { id: true, activeDraftId: true },
      });

      if (!page) {
        const created = await tx.marketingPage.create({
          data: {
            key: pageKey,
            title: pageMeta.title,
            description: pageMeta.description,
          },
          select: { id: true, activeDraftId: true },
        });
        page = created;
      } else {
        await tx.marketingPage.update({
          where: { id: page.id },
          data: {
            title: pageMeta.title,
            description: pageMeta.description,
          },
        });
      }

      const savedDraft = page.activeDraftId
        ? await tx.marketingPageVersion.update({
            where: { id: page.activeDraftId },
            data: {
              schemaVersion: MARKETING_CONTENT_SCHEMA_VERSION,
              content: validated.value as unknown as Prisma.InputJsonValue,
              changeSummary,
              createdByUserId: internalCtx.userId,
            },
            select: {
              id: true,
              version: true,
              status: true,
              changeSummary: true,
              updatedAt: true,
            },
          })
        : await createDraftVersion(tx, {
            pageId: page.id,
            actorUserId: internalCtx.userId,
            content: nextContent,
            changeSummary,
          });

      if (!page.activeDraftId) {
        await tx.marketingPage.update({
          where: { id: page.id },
          data: { activeDraftId: savedDraft.id },
        });
      }

      await tx.auditLog.create({
        data: {
          userId: internalCtx.userId,
          userName: internalCtx.email,
          action: "INTERNAL_MARKETING_DRAFT_SAVED",
          target: `${pageMeta.title} draft v${savedDraft.version}`,
        },
      });

      return savedDraft;
    });

    logApiInfo(req, "Internal marketing draft saved", {
      area: "internal-marketing-content",
      requestId,
      pageKey,
      draftVersion: draft.version,
      actorRole: internalCtx.role,
    });
    return NextResponse.json({ ok: true, draft, actorRole: internalCtx.role, requestId });
  } catch (error) {
    logApiError(req, "Internal marketing draft save failed", error, { area: "internal-marketing-content", requestId });
    const message = error instanceof Error ? error.message : "Ukendt fejl";
    return NextResponse.json({ error: message, requestId }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const requestId = getRequestIdFromRequest(req);
  try {
    const internalCtx = await getInternalAdminContext();
    if (!internalCtx) {
      return NextResponse.json({ error: "Ingen adgang" }, { status: 403 });
    }
    if (!canManageMarketingContent(internalCtx.role)) {
      return NextResponse.json({ error: "Kun np_super_admin kan publicere eller rollbacke marketing-sider." }, { status: 403 });
    }

    const body = (await req.json()) as {
      pageKey?: unknown;
      action?: unknown;
      versionId?: unknown;
    };
    const pageKey = parsePageKey(body.pageKey);
    const action = typeof body.action === "string" ? body.action.trim() : "";
    const versionId = typeof body.versionId === "string" ? body.versionId.trim() : "";

    if (!pageKey) {
      return NextResponse.json({ error: "Ugyldig eller manglende pageKey." }, { status: 400 });
    }
    if (action !== "publish" && action !== "rollback") {
      return NextResponse.json({ error: "Ugyldig handling. Brug action=publish eller action=rollback." }, { status: 400 });
    }

    const page = await prisma.marketingPage.findUnique({
      where: { key: pageKey },
      select: {
        id: true,
        activeDraftId: true,
        publishedVersionId: true,
      },
    });

    if (!page) {
      return NextResponse.json(
        { error: "Marketing-siden findes ikke endnu. Gem en draft først, før du publicerer." },
        { status: 404 }
      );
    }

    const targetVersion = action === "publish"
      ? page.activeDraftId
        ? await prisma.marketingPageVersion.findUnique({
            where: { id: page.activeDraftId },
            select: { id: true, version: true, status: true },
          })
        : null
      : await prisma.marketingPageVersion.findFirst({
          where: {
            marketingPageId: page.id,
            id: versionId || undefined,
            status: { not: "draft" },
          },
          orderBy: [{ version: "desc" }],
          select: { id: true, version: true, status: true },
        });

    if (!targetVersion) {
      return NextResponse.json(
        {
          error:
            action === "publish"
              ? "Ingen draft fundet til publish. Gem en draft først."
              : "Ingen version fundet til rollback.",
        },
        { status: 404 }
      );
    }

    if (action === "rollback" && targetVersion.id === page.publishedVersionId) {
      return NextResponse.json({ error: "Den valgte version er allerede aktiv." }, { status: 400 });
    }

    const updatedVersion = await prisma.$transaction(async (tx) => {
      if (page.publishedVersionId && page.publishedVersionId !== targetVersion.id) {
        await tx.marketingPageVersion.update({
          where: { id: page.publishedVersionId },
          data: { status: "archived" },
        });
      }

      const nextPublished = await tx.marketingPageVersion.update({
        where: { id: targetVersion.id },
        data: {
          status: "published",
          publishedAt: new Date(),
          publishedByUserId: internalCtx.userId,
        },
        select: {
          id: true,
          version: true,
          status: true,
          publishedAt: true,
        },
      });

      await tx.marketingPage.update({
        where: { id: page.id },
        data: {
          publishedVersionId: nextPublished.id,
          activeDraftId: action === "publish" ? null : page.activeDraftId,
        },
      });

      await tx.auditLog.create({
        data: {
          userId: internalCtx.userId,
          userName: internalCtx.email,
          action: action === "publish" ? "INTERNAL_MARKETING_PAGE_PUBLISHED" : "INTERNAL_MARKETING_PAGE_ROLLED_BACK",
          target: `${MARKETING_PAGE_TITLES[pageKey]} v${nextPublished.version}`,
        },
      });

      return nextPublished;
    });

    logApiInfo(req, "Internal marketing version transition completed", {
      area: "internal-marketing-content",
      requestId,
      pageKey,
      action,
      version: updatedVersion.version,
      actorRole: internalCtx.role,
    });

    for (const path of getMarketingRevalidationPaths(pageKey)) {
      revalidatePath(path);
    }

    return NextResponse.json({ ok: true, version: updatedVersion, actorRole: internalCtx.role, requestId });
  } catch (error) {
    logApiError(req, "Internal marketing version transition failed", error, { area: "internal-marketing-content", requestId });
    const message = error instanceof Error ? error.message : "Ukendt fejl";
    return NextResponse.json({ error: message, requestId }, { status: 500 });
  }
}

async function createDraftVersion(
  tx: Prisma.TransactionClient,
  input: {
    pageId: string;
    actorUserId: string;
    content: MarketingPageContent;
    changeSummary: string | null;
  }
) {
  const latest = await tx.marketingPageVersion.findFirst({
    where: { marketingPageId: input.pageId },
    orderBy: { version: "desc" },
    select: { version: true },
  });

  return tx.marketingPageVersion.create({
    data: {
      marketingPageId: input.pageId,
      version: (latest?.version ?? 0) + 1,
      status: "draft",
      schemaVersion: MARKETING_CONTENT_SCHEMA_VERSION,
      content: input.content as unknown as Prisma.InputJsonValue,
      changeSummary: input.changeSummary,
      createdByUserId: input.actorUserId,
    },
    select: {
      id: true,
      version: true,
      status: true,
      changeSummary: true,
      updatedAt: true,
    },
  });
}

function getPageKeyFromRequest(url: string): MarketingPageKey {
  const pageKey = new URL(url).searchParams.get("pageKey")?.trim() || "home";
  return isSupportedMarketingPageKey(pageKey) ? pageKey : "home";
}

function parsePageKey(value: unknown): MarketingPageKey | null {
  if (typeof value !== "string") {
    return null;
  }

  return isSupportedMarketingPageKey(value.trim()) ? (value.trim() as MarketingPageKey) : null;
}

function getPageMeta(pageKey: MarketingPageKey) {
  return {
    title: MARKETING_PAGE_TITLES[pageKey],
    description: MARKETING_PAGE_DESCRIPTIONS[pageKey],
  };
}
