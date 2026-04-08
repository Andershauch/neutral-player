import { describe, expect, it } from "vitest";
import {
  resolveMarketingPageContentFromRecord,
  type ResolvedMarketingAsset,
} from "@/lib/marketing-content-runtime";
import { MARKETING_CONTENT_SCHEMA_VERSION } from "@/lib/marketing-content-schema";

describe("marketing content runtime resolver", () => {
  it("uses published content when it validates and indexes referenced assets", () => {
    const asset: ResolvedMarketingAsset = {
      key: "marketing/home-hero-image",
      kind: "image",
      fileName: "hero.png",
      url: "data:image/png;base64,abc",
      mimeType: "image/png",
      altText: "Hero preview",
      title: "Hero",
      width: 1600,
      height: 900,
    };

    const result = resolveMarketingPageContentFromRecord({
      pageKey: "home",
      publishedContent: {
        schemaVersion: MARKETING_CONTENT_SCHEMA_VERSION,
        hero: {
          kicker: "Serviceoplevelser",
          badge: "Book en intro",
          title: "Byg en bedre serviceoplevelse",
          body: "Public copy fra editoren.",
          primaryCta: { label: "Se planer", href: "/pricing", variant: "primary" },
          secondaryCta: { label: "Kontakt salg", href: "/contact", variant: "ghost" },
          media: {
            kind: "image",
            primaryAsset: {
              assetKey: asset.key,
              alt: "Hero",
            },
          },
        },
        decisionSignals: [
          { label: "A", value: "B" },
          { label: "C", value: "D" },
          { label: "E", value: "F" },
        ],
        serviceCards: [
          {
            title: "Support",
            summary: "Summary",
            points: ["Ét flow"],
            cta: { label: "Se", href: "/pricing", variant: "primary" },
          },
          {
            title: "Rollout",
            summary: "Summary 2",
            points: ["Mindre dobbeltarbejde"],
            cta: { label: "Tal med salg", href: "/contact", variant: "secondary" },
          },
        ],
        stories: [
          {
            company: "Northlane",
            impact: "47% hurtigere",
            quote: "Vi samlede historier og servicevalg.",
            person: "Signe",
            role: "Head of Customer Programs",
          },
        ],
        trustedBy: ["Northlane"],
        salesCta: {
          kicker: "Kontakt salg",
          title: "Tal med os",
          body: "Vi hjælper med rollout.",
          primaryCta: { label: "Kontakt salg", href: "/contact", variant: "primary" },
          secondaryCta: { label: "Se planer", href: "/pricing", variant: "ghost" },
          bullets: ["Flere serviceveje"],
        },
      },
      assets: [asset],
    });

    expect(result.source).toBe("published");
    expect(result.content.hero.title).toBe("Byg en bedre serviceoplevelse");
    expect(result.assetsByKey[asset.key]?.url).toBe(asset.url);
  });

  it("falls back to default content when published payload is invalid", () => {
    const result = resolveMarketingPageContentFromRecord({
      pageKey: "pricing",
      publishedContent: {
        schemaVersion: MARKETING_CONTENT_SCHEMA_VERSION,
        hero: {
          kicker: "Broken",
        },
      },
    });

    expect(result.source).toBe("default");
    expect(result.content.hero.kicker).toBe("Planer og servicevalg");
  });
});
