import { describe, expect, it } from "vitest";
import {
  MARKETING_PAGE_DESCRIPTIONS,
  MARKETING_PAGE_KEYS,
  MARKETING_PAGE_TITLES,
  MARKETING_PAGE_VERSION_STATUSES,
} from "@/lib/marketing-pages";

describe("marketing page registry", () => {
  it("defines the supported v1 marketing pages", () => {
    expect(MARKETING_PAGE_KEYS).toEqual(["home", "pricing", "faq", "contact"]);
    expect(MARKETING_PAGE_TITLES.home).toBe("Landing");
    expect(MARKETING_PAGE_TITLES.pricing).toBe("Pricing");
    expect(MARKETING_PAGE_DESCRIPTIONS.contact).toContain("Contact-siden");
  });

  it("defines the supported page version statuses", () => {
    expect(MARKETING_PAGE_VERSION_STATUSES).toEqual(["draft", "published", "archived"]);
  });
});
