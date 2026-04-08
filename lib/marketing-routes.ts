import { type MarketingPageKey } from "@/lib/marketing-pages";

export function getMarketingPublicPath(pageKey: MarketingPageKey): string {
  if (pageKey === "home") return "/";
  return `/${pageKey}`;
}
