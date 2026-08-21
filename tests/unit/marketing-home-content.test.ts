import { describe, expect, it } from "vitest";
import { getDefaultMarketingContent } from "@/lib/marketing-content-defaults";
import { validateHomeMarketingContent } from "@/lib/marketing-content-schema";
import type { HomeMarketingContent } from "@/lib/marketing-content-schema";

const home = getDefaultMarketingContent("home") as HomeMarketingContent;

describe("home marketing defaults", () => {
  it("validates against the schema", () => {
    const result = validateHomeMarketingContent(home);
    expect(result.ok).toBe(true);
  });

  it("ships no fabricated customer references", () => {
    // Opdigtede kundecitater må ikke stå på en side, offentlige indkøbere
    // træffer beslutninger ud fra. Sektionerne vises først når der er rigtige.
    expect(home.stories).toEqual([]);
    expect(home.trustedBy).toEqual([]);
  });

  it("still validates when references are empty", () => {
    const result = validateHomeMarketingContent({ ...home, stories: [], trustedBy: [] });
    expect(result.ok).toBe(true);
  });

  it("accepts real references once they exist", () => {
    const result = validateHomeMarketingContent({
      ...home,
      trustedBy: ["Eksempel Kommune"],
      stories: [
        {
          company: "Eksempel Kommune",
          impact: "Fire sprog på samme borgerinformation",
          quote: "Vi vedligeholder ét link i stedet for fire sider.",
          person: "Fornavn Efternavn",
          role: "Kommunikationschef",
        },
      ],
    });
    expect(result.ok).toBe(true);
  });

  it("speaks to the buyer instead of describing the page itself", () => {
    const copy = [home.hero.title, home.hero.body, home.salesCta.body].join(" ").toLowerCase();
    for (const tell of ["forsiden skal", "saas-sider", "inspireret af", "designnoter"]) {
      expect(copy).not.toContain(tell);
    }
  });
});
