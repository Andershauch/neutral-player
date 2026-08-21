import { describe, expect, it } from "vitest";
import {
  buildSubtitleTrackName,
  GENERATED_SUBTITLE_LANGUAGES,
  getSubtitleLanguage,
  getSubtitleStatusLabel,
  isSupportedSubtitleLanguage,
} from "@/lib/subtitles";

describe("subtitle languages", () => {
  it("supports Danish, since the product targets Danish public institutions", () => {
    expect(isSupportedSubtitleLanguage("da")).toBe(true);
    expect(getSubtitleLanguage("da")?.label).toBe("Dansk");
  });

  it("marks Danish as beta so the UI can warn before publishing", () => {
    // Mux har dansk i beta. Det skal siges hoejt, ikke skjules.
    expect(getSubtitleLanguage("da")?.beta).toBe(true);
    expect(getSubtitleLanguage("en")?.beta).toBe(false);
  });

  it("rejects languages Mux cannot generate", () => {
    // Playeren tilbyder flere sprogvarianter end Mux kan auto-tekste.
    expect(isSupportedSubtitleLanguage("fo")).toBe(false);
    expect(isSupportedSubtitleLanguage("gl")).toBe(false);
    expect(isSupportedSubtitleLanguage("")).toBe(false);
  });

  it("names tracks so viewers can tell generated subtitles apart", () => {
    expect(buildSubtitleTrackName("da")).toBe("Dansk (auto)");
    expect(buildSubtitleTrackName("zz")).toBe("ZZ (auto)");
  });

  it("has no duplicate language codes", () => {
    const codes = GENERATED_SUBTITLE_LANGUAGES.map((l) => l.code);
    expect(new Set(codes).size).toBe(codes.length);
  });

  it("labels every status in Danish", () => {
    expect(getSubtitleStatusLabel("ready")).toBe("Klar");
    expect(getSubtitleStatusLabel("errored")).toBe("Fejlede");
    expect(getSubtitleStatusLabel("requested")).toBe("Behandles");
  });
});
