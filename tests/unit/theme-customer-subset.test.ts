import { describe, expect, it } from "vitest";
import { DEFAULT_THEME_TOKENS, validateCustomerThemeTokens } from "@/lib/theme-schema";

describe("customer theme subset validation", () => {
  it("accepts changes within the customer self-service subset", () => {
    const result = validateCustomerThemeTokens(
      {
        ...DEFAULT_THEME_TOKENS,
        colors: {
          ...DEFAULT_THEME_TOKENS.colors,
          primary: "#ff5ca8",
        },
        radius: {
          ...DEFAULT_THEME_TOKENS.radius,
          pill: "1rem",
        },
      },
      DEFAULT_THEME_TOKENS
    );

    expect(result.ok).toBe(true);
    expect(result.value?.colors.primary).toBe("#ff5ca8");
  });

  it("rejects advanced token changes outside the customer subset", () => {
    const result = validateCustomerThemeTokens(
      {
        ...DEFAULT_THEME_TOKENS,
        shadows: {
          card: "0 8px 32px rgba(0, 0, 0, 0.35)",
        },
      },
      DEFAULT_THEME_TOKENS
    );

    expect(result.ok).toBe(false);
    expect(result.errors).toContain('"shadows.card" er ikke tilgaengelig i self-service branding.');
  });
});
