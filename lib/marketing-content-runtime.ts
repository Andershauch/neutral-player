import { getDefaultMarketingContent } from "@/lib/marketing-content-defaults";
import { validateMarketingPageContent, type MarketingPageContent } from "@/lib/marketing-content-schema";
import { type MarketingPageKey } from "@/lib/marketing-pages";
import { prisma } from "@/lib/prisma";

export type ResolvedMarketingAsset = {
  key: string;
  kind: string;
  fileName: string;
  url: string;
  mimeType: string;
  altText: string | null;
  title: string | null;
  width: number | null;
  height: number | null;
};

export type ResolvedMarketingPageContent<T extends MarketingPageContent = MarketingPageContent> = {
  source: "default" | "published";
  content: T;
  assetsByKey: Record<string, ResolvedMarketingAsset>;
};

export type InternalMarketingPreviewContent<T extends MarketingPageContent = MarketingPageContent> = {
  source: "draft" | "published" | "default";
  content: T;
  assetsByKey: Record<string, ResolvedMarketingAsset>;
  hasDraft: boolean;
  hasPublished: boolean;
};

export function resolveMarketingPageContentFromRecord<T extends MarketingPageContent = MarketingPageContent>(input: {
  pageKey: MarketingPageKey;
  publishedContent: unknown;
  assets?: ResolvedMarketingAsset[];
}): ResolvedMarketingPageContent<T> {
  const fallback = getDefaultMarketingContent(input.pageKey) as T;
  const validated = validateMarketingPageContent(input.pageKey, input.publishedContent);
  if (!validated.ok || !validated.value) {
    return {
      source: "default",
      content: fallback,
      assetsByKey: {},
    };
  }

  const usedAssetKeys = collectMarketingAssetKeys(validated.value);
  const assetsByKey = indexAssetsByKey(
    (input.assets || []).filter((asset) => usedAssetKeys.has(asset.key))
  );

  return {
    source: "published",
    content: validated.value as T,
    assetsByKey,
  };
}

export async function getResolvedMarketingPageContent<T extends MarketingPageContent = MarketingPageContent>(
  pageKey: MarketingPageKey
): Promise<ResolvedMarketingPageContent<T>> {
  const fallback = {
    source: "default" as const,
    content: getDefaultMarketingContent(pageKey) as T,
    assetsByKey: {},
  };

  try {
    const page = await prisma.marketingPage.findUnique({
      where: { key: pageKey },
      select: {
        publishedVersion: {
          select: {
            content: true,
          },
        },
      },
    });

    if (!page?.publishedVersion?.content) {
      return fallback;
    }

    const validated = validateMarketingPageContent(pageKey, page.publishedVersion.content);
    if (!validated.ok || !validated.value) {
      console.warn(
        JSON.stringify({
          level: "warn",
          message: "Published marketing content invalid, falling back to defaults",
          pageKey,
          errors: validated.errors,
          timestamp: new Date().toISOString(),
        })
      );
      return fallback;
    }

    const usedAssetKeys = [...collectMarketingAssetKeys(validated.value)];
    const assets = usedAssetKeys.length
      ? await prisma.marketingAsset.findMany({
          where: { key: { in: usedAssetKeys } },
          select: {
            key: true,
            kind: true,
            fileName: true,
            url: true,
            mimeType: true,
            altText: true,
            title: true,
            width: true,
            height: true,
          },
        })
      : [];

    return {
      source: "published",
      content: validated.value as T,
      assetsByKey: indexAssetsByKey(assets),
    };
  } catch (error) {
    console.warn(
      JSON.stringify({
        level: "warn",
        message: "Marketing content runtime fallback activated",
        pageKey,
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : String(error),
      })
    );
    return fallback;
  }
}

export async function getInternalMarketingPreviewContent<T extends MarketingPageContent = MarketingPageContent>(
  pageKey: MarketingPageKey
): Promise<InternalMarketingPreviewContent<T>> {
  const defaultContent = getDefaultMarketingContent(pageKey) as T;

  try {
    const page = await prisma.marketingPage.findUnique({
      where: { key: pageKey },
      select: {
        activeDraft: {
          select: {
            content: true,
          },
        },
        publishedVersion: {
          select: {
            content: true,
          },
        },
      },
    });

    const hasDraft = Boolean(page?.activeDraft?.content);
    const hasPublished = Boolean(page?.publishedVersion?.content);

    const draftValidated = page?.activeDraft?.content
      ? validateMarketingPageContent(pageKey, page.activeDraft.content)
      : null;
    if (draftValidated?.ok && draftValidated.value) {
      const assets = await loadAssetsForContent(draftValidated.value);
      return {
        source: "draft",
        content: draftValidated.value as T,
        assetsByKey: indexAssetsByKey(assets),
        hasDraft,
        hasPublished,
      };
    }
    if (page?.activeDraft?.content && draftValidated && !draftValidated.ok) {
      console.warn(
        JSON.stringify({
          level: "warn",
          message: "Marketing draft preview content invalid, falling back",
          pageKey,
          errors: draftValidated.errors,
          timestamp: new Date().toISOString(),
        })
      );
    }

    const publishedValidated = page?.publishedVersion?.content
      ? validateMarketingPageContent(pageKey, page.publishedVersion.content)
      : null;
    if (publishedValidated?.ok && publishedValidated.value) {
      const assets = await loadAssetsForContent(publishedValidated.value);
      return {
        source: "published",
        content: publishedValidated.value as T,
        assetsByKey: indexAssetsByKey(assets),
        hasDraft,
        hasPublished,
      };
    }
    if (page?.publishedVersion?.content && publishedValidated && !publishedValidated.ok) {
      console.warn(
        JSON.stringify({
          level: "warn",
          message: "Marketing published preview content invalid, falling back",
          pageKey,
          errors: publishedValidated.errors,
          timestamp: new Date().toISOString(),
        })
      );
    }

    return {
      source: "default",
      content: defaultContent,
      assetsByKey: {},
      hasDraft,
      hasPublished,
    };
  } catch {
    return {
      source: "default",
      content: defaultContent,
      assetsByKey: {},
      hasDraft: false,
      hasPublished: false,
    };
  }
}

function collectMarketingAssetKeys(value: unknown, keys = new Set<string>()): Set<string> {
  if (Array.isArray(value)) {
    for (const item of value) {
      collectMarketingAssetKeys(item, keys);
    }
    return keys;
  }

  if (typeof value !== "object" || value === null) {
    return keys;
  }

  const record = value as Record<string, unknown>;
  for (const [key, nestedValue] of Object.entries(record)) {
    if (key === "assetKey" && typeof nestedValue === "string" && nestedValue.trim()) {
      keys.add(nestedValue.trim());
      continue;
    }
    collectMarketingAssetKeys(nestedValue, keys);
  }

  return keys;
}

function indexAssetsByKey(assets: ResolvedMarketingAsset[]): Record<string, ResolvedMarketingAsset> {
  return assets.reduce<Record<string, ResolvedMarketingAsset>>((acc, asset) => {
    acc[asset.key] = asset;
    return acc;
  }, {});
}

async function loadAssetsForContent(content: MarketingPageContent): Promise<ResolvedMarketingAsset[]> {
  const usedAssetKeys = [...collectMarketingAssetKeys(content)];
  if (usedAssetKeys.length === 0) {
    return [];
  }

  return prisma.marketingAsset.findMany({
    where: { key: { in: usedAssetKeys } },
    select: {
      key: true,
      kind: true,
      fileName: true,
      url: true,
      mimeType: true,
      altText: true,
      title: true,
      width: true,
      height: true,
    },
  });
}
