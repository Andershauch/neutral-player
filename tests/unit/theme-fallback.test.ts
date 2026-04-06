import { describe, expect, it } from "vitest";
import { DEFAULT_THEME_TOKENS } from "@/lib/theme-schema";
import { resolveThemeTokenSource } from "@/lib/theme";

describe("theme fallback resolution", () => {
  it("falls back to bundled defaults when no stored themes exist", () => {
    const result = resolveThemeTokenSource({
      defaultTokens: DEFAULT_THEME_TOKENS,
      globalTokens: null,
      organizationTokens: null,
      enterpriseBrandingEnabled: false,
    });

    expect(result.source).toBe("default");
    expect(result.tokens).toEqual(DEFAULT_THEME_TOKENS);
    expect(result.tokens).not.toBe(DEFAULT_THEME_TOKENS);
  });

  it("uses the published global theme when available", () => {
    const globalTokens = {
      ...DEFAULT_THEME_TOKENS,
      colors: {
        ...DEFAULT_THEME_TOKENS.colors,
        primary: "#ff5ca8",
      },
    };

    const result = resolveThemeTokenSource({
      defaultTokens: DEFAULT_THEME_TOKENS,
      globalTokens,
      organizationTokens: null,
      enterpriseBrandingEnabled: false,
    });

    expect(result.source).toBe("global");
    expect(result.tokens).toEqual(globalTokens);
    expect(result.tokens).not.toBe(globalTokens);
  });

  it("uses the organization theme for enterprise orgs", () => {
    const organizationTokens = {
      ...DEFAULT_THEME_TOKENS,
      colors: {
        ...DEFAULT_THEME_TOKENS.colors,
        primaryStrong: "#14532d",
      },
    };

    const result = resolveThemeTokenSource({
      defaultTokens: DEFAULT_THEME_TOKENS,
      globalTokens: DEFAULT_THEME_TOKENS,
      organizationTokens,
      enterpriseBrandingEnabled: true,
    });

    expect(result.source).toBe("organization");
    expect(result.tokens).toEqual(organizationTokens);
    expect(result.tokens).not.toBe(organizationTokens);
  });

  it("falls back to the global theme when enterprise branding has no org override", () => {
    const globalTokens = {
      ...DEFAULT_THEME_TOKENS,
      player: {
        ...DEFAULT_THEME_TOKENS.player,
        playButtonHoverBg: "#1d4ed8",
      },
    };

    const result = resolveThemeTokenSource({
      defaultTokens: DEFAULT_THEME_TOKENS,
      globalTokens,
      organizationTokens: null,
      enterpriseBrandingEnabled: true,
    });

    expect(result.source).toBe("global");
    expect(result.tokens).toEqual(globalTokens);
  });
});
