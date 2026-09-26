import { describe, expect, it } from "vitest";
import { DEFAULT_THEME_TOKENS, validateThemeTokens } from "@/lib/theme-schema";

describe("theme schema backward compatibility", () => {
  it("accepts a theme published before the player control fields existed", () => {
    // Simulerer et rigtigt tema, der laa i databasen foer controlBg/controlBorder/
    // controlHoverBg blev tilfoejet til skemaet. Det maa IKKE blive afvist som
    // ugyldigt, for saa mister kunden hele sit publicerede tema, ikke bare de
    // manglende felter.
    const legacyPlayer = { ...DEFAULT_THEME_TOKENS.player } as Record<string, unknown>;
    delete legacyPlayer.controlBg;
    delete legacyPlayer.controlBorder;
    delete legacyPlayer.controlHoverBg;

    const legacyPayload = {
      ...DEFAULT_THEME_TOKENS,
      player: legacyPlayer,
    };

    const result = validateThemeTokens(legacyPayload);

    expect(result.ok).toBe(true);
    expect(result.value?.player.controlBg).toBe(DEFAULT_THEME_TOKENS.player.controlBg);
    expect(result.value?.player.controlBorder).toBe(DEFAULT_THEME_TOKENS.player.controlBorder);
    expect(result.value?.player.controlHoverBg).toBe(DEFAULT_THEME_TOKENS.player.controlHoverBg);
  });

  it("still validates a fully modern payload including the new control fields", () => {
    const result = validateThemeTokens(DEFAULT_THEME_TOKENS);
    expect(result.ok).toBe(true);
    expect(result.value).toEqual(DEFAULT_THEME_TOKENS);
  });

  it("ignores a malformed control field instead of rejecting the whole theme", () => {
    const payload = {
      ...DEFAULT_THEME_TOKENS,
      player: {
        ...DEFAULT_THEME_TOKENS.player,
        controlBg: "not-a-color",
      },
    };

    const result = validateThemeTokens(payload);
    expect(result.ok).toBe(true);
    expect(result.value?.player.controlBg).toBe(DEFAULT_THEME_TOKENS.player.controlBg);
  });

  it("still rejects a payload missing long-established required fields", () => {
    const payload = {
      ...DEFAULT_THEME_TOKENS,
      player: {
        ...DEFAULT_THEME_TOKENS.player,
        playButtonBg: undefined,
      },
    };

    const result = validateThemeTokens(payload);
    expect(result.ok).toBe(false);
  });
});
