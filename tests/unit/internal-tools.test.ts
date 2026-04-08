import { describe, expect, it } from "vitest";
import { getInternalTool, INTERNAL_TOOLS } from "@/lib/internal-tools";

describe("internal tools", () => {
  it("exposes the expected internal tool destinations", () => {
    expect(INTERNAL_TOOLS.map((tool) => tool.href)).toEqual(["/internal", "/internal/marketing"]);
  });

  it("matches internal home exactly", () => {
    expect(getInternalTool("/internal")?.label).toBe("Branding");
  });

  it("matches nested marketing routes", () => {
    expect(getInternalTool("/internal/marketing")?.label).toBe("Marketing");
    expect(getInternalTool("/internal/marketing/preview/home")?.label).toBe("Marketing");
  });
});
