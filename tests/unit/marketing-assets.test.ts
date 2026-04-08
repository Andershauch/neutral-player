import { describe, expect, it } from "vitest";
import {
  createMarketingAssetKey,
  describeAspectRatio,
  isAllowedMarketingImageMimeType,
  MARKETING_ASSET_FALLBACK_URL,
} from "@/lib/marketing-assets";

describe("marketing assets helpers", () => {
  it("creates stable asset keys from titles and filenames", () => {
    expect(
      createMarketingAssetKey({
        fileName: "Hero Banner.png",
        title: "Vælg service først",
        suffix: "abc123",
      })
    ).toBe("marketing/vaelg-service-foerst-abc123");
  });

  it("describes common aspect ratios for editor guidance", () => {
    expect(describeAspectRatio(1600, 900)).toContain("16:9");
    expect(describeAspectRatio(1200, 1200)).toContain("1:1");
    expect(describeAspectRatio(null, null)).toBe("Ukendt ratio");
  });

  it("allowlists the supported v1 marketing image mime types", () => {
    expect(isAllowedMarketingImageMimeType("image/webp")).toBe(true);
    expect(isAllowedMarketingImageMimeType("image/svg+xml")).toBe(false);
    expect(MARKETING_ASSET_FALLBACK_URL).toBe("/images/hero-product-demo.svg");
  });
});
