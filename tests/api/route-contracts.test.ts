import fs from "fs";
import path from "path";
import { describe, expect, it } from "vitest";

function read(relativePath: string): string {
  return fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

describe("API route contracts", () => {
  it("enforces tenant scoping in key write routes", () => {
    const scopedRoutes = [
      "app/api/embeds/route.ts",
      "app/api/embeds/[id]/route.ts",
      "app/api/variants/route.ts",
      "app/api/variants/[id]/route.ts",
      "app/api/users/[id]/route.ts",
      "app/api/users/invite/route.ts",
    ];

    for (const route of scopedRoutes) {
      const source = read(route);
      expect(source).toContain("organizationId");
    }
  });

  it("uses explicit org-context RBAC helpers for protected write flows", () => {
    const expectations: Array<{ file: string; guard: string }> = [
      { file: "app/api/embeds/route.ts", guard: "getOrgContextForContentEdit" },
      { file: "app/api/embeds/[id]/route.ts", guard: "getOrgContextForContentEdit" },
      { file: "app/api/variants/route.ts", guard: "getOrgContextForContentEdit" },
      { file: "app/api/variants/[id]/route.ts", guard: "getOrgContextForContentEdit" },
      { file: "app/api/users/[id]/route.ts", guard: "getOrgContextForMemberManagement" },
      { file: "app/api/users/invite/route.ts", guard: "getOrgContextForMemberManagement" },
      { file: "app/api/billing/checkout/route.ts", guard: "getOrgContextForBilling" },
    ];

    for (const item of expectations) {
      const source = read(item.file);
      expect(source).toContain(item.guard);
    }
  });

  it("enforces plan limits in create-heavy routes", () => {
    const sourceEmbeds = read("app/api/embeds/route.ts");
    const sourceVariants = read("app/api/variants/route.ts");
    const sourceInvite = read("app/api/users/invite/route.ts");

    expect(sourceEmbeds).toContain("assertLimit");
    expect(sourceVariants).toContain("assertLimit");
    expect(sourceInvite).toContain("assertLimit");
  });
});
