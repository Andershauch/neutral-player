import fs from "fs";
import path from "path";
import { describe, expect, it } from "vitest";

function read(relativePath: string): string {
  return fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

describe("Marketing content internal contracts", () => {
  it("guards internal marketing content routes with internal admin access and write-role checks", () => {
    const source = read("app/api/internal/marketing/content/route.ts");

    expect(source).toContain("getInternalAdminContext");
    expect(source).toContain("canManageMarketingContent");
    expect(source).toContain('return NextResponse.json({ error: "Ingen adgang" }, { status: 403 })');
  });

  it("uses the shared content validator and audit log in marketing content writes", () => {
    const source = read("app/api/internal/marketing/content/route.ts");

    expect(source).toContain("validateMarketingPageContent");
    expect(source).toContain("auditLog.create");
    expect(source).toContain("INTERNAL_MARKETING_PAGE_PUBLISHED");
    expect(source).toContain("INTERNAL_MARKETING_PAGE_ROLLED_BACK");
    expect(source).toContain("INTERNAL_MARKETING_DRAFT_SAVED");
    expect(source).toContain("logApiInfo");
    expect(source).toContain("logApiWarn");
    expect(source).toContain("logApiError");
  });

  it("guards marketing asset uploads and records observability plus audit trail", () => {
    const source = read("app/api/internal/marketing/assets/route.ts");

    expect(source).toContain("formData()");
    expect(source).toContain("canManageMarketingContent");
    expect(source).toContain("MARKETING_MAX_IMAGE_BYTES");
    expect(source).toContain("auditLog.create");
    expect(source).toContain("logApiInfo");
    expect(source).toContain("logApiWarn");
    expect(source).toContain("INTERNAL_MARKETING_ASSET_UPLOADED");
  });

  it("exposes a dedicated internal draft preview route that stays separate from the live public pages", () => {
    const source = read("app/internal/marketing/preview/[pageKey]/page.tsx");

    expect(source).toContain("getInternalMarketingPreviewContent");
    expect(source).toContain('href="/internal/marketing"');
    expect(source).toContain("Live public-siden");
  });
});
