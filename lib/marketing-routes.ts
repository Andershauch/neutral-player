import { type MarketingPageKey } from "@/lib/marketing-pages";

export function getMarketingPublicPath(pageKey: MarketingPageKey): string {
  if (pageKey === "home") return "/";
  return `/${pageKey}`;
}

export function getInternalMarketingPreviewPath(pageKey: MarketingPageKey): string {
  return `/internal/marketing/preview/${pageKey}`;
}

export function getMarketingRevalidationPaths(pageKey: MarketingPageKey): string[] {
  return [
    getMarketingPublicPath(pageKey),
    "/internal/marketing",
    getInternalMarketingPreviewPath(pageKey),
  ];
}
