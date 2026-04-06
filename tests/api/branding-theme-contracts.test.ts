import fs from "fs";
import path from "path";
import { describe, expect, it } from "vitest";

function read(relativePath: string): string {
  return fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

describe("Branding theme API contracts", () => {
  it("guards customer branding routes with org-context RBAC", () => {
    const source = read("app/api/branding/theme/route.ts");

    expect(source).toContain("getOrgContextForBranding");
    expect(source).toContain('return NextResponse.json({ error: "Ingen adgang" }, { status: 403 })');
  });

  it("enforces enterprise plan gate and payload validation for customer branding writes", () => {
    const source = read("app/api/branding/theme/route.ts");

    expect(source).toContain("getOrgPlanAndCapabilities");
    expect(source).toContain("capabilities.enterpriseBrandingEnabled");
    expect(source).toContain('code: "ENTERPRISE_REQUIRED"');
    expect(source).toContain("validateThemeTokens");
  });

  it("records audit log entries when customer branding is published", () => {
    const source = read("app/api/branding/theme/route.ts");

    expect(source).toContain("auditLog.create");
    expect(source).toContain('action: "PUBLISH_ORG_THEME"');
  });

  it("guards internal branding routes with internal admin access", () => {
    const source = read("app/api/internal/branding/theme/route.ts");

    expect(source).toContain("getInternalAdminContext");
    expect(source).toContain("canManageInternalBranding");
    expect(source).toContain('return NextResponse.json({ error: "Ingen adgang" }, { status: 403 })');
  });

  it("enforces enterprise gating and validation for internal org-theme writes", () => {
    const source = read("app/api/internal/branding/theme/route.ts");

    expect(source).toContain("getScopeConfig");
    expect(source).toContain("getOrgPlanAndCapabilities");
    expect(source).toContain("capabilities.enterpriseBrandingEnabled");
    expect(source).toContain('code: "ENTERPRISE_REQUIRED"');
    expect(source).toContain("validateThemeTokens");
  });

  it("records internal publish and rollback actions in the audit log", () => {
    const source = read("app/api/internal/branding/theme/route.ts");

    expect(source).toContain("auditLog.create");
    expect(source).toContain('action === "publish" ? "INTERNAL_PUBLISH_ORG_THEME" : "INTERNAL_ROLLBACK_ORG_THEME"');
  });
});
