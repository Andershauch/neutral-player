import { describe, expect, it } from "vitest";
import {
  buildMuxSubtitleUrl,
  buildSubtitleTrackName,
  GENERATED_SUBTITLE_LANGUAGES,
  getSubtitleLanguage,
  getSubtitleStatusLabel,
  isSupportedSubtitleLanguage,
  isValidCustomSubtitleLanguageCode,
  looksLikeWebVtt,
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

  it("builds Mux's fixed VTT URL pattern for a generated track", () => {
    expect(buildMuxSubtitleUrl("abc123", "trk456")).toBe(
      "https://stream.mux.com/abc123/text/trk456.vtt"
    );
  });

  it("accepts plain and regional language codes for uploaded subtitles", () => {
    expect(isValidCustomSubtitleLanguageCode("da")).toBe(true);
    expect(isValidCustomSubtitleLanguageCode("da-dtv")).toBe(true);
    expect(isValidCustomSubtitleLanguageCode("EN")).toBe(true);
  });

  it("rejects malformed language codes for uploaded subtitles", () => {
    expect(isValidCustomSubtitleLanguageCode("")).toBe(false);
    expect(isValidCustomSubtitleLanguageCode("danish")).toBe(false);
    expect(isValidCustomSubtitleLanguageCode("<script>")).toBe(false);
  });

  it("recognizes a valid WebVTT file, including with a leading BOM", () => {
    expect(looksLikeWebVtt("WEBVTT\n\n00:00:00.000 --> 00:00:01.000\nHej")).toBe(true);
    expect(looksLikeWebVtt("﻿WEBVTT\n\n1\n00:00:00.000 --> 00:00:01.000\nHej")).toBe(true);
  });

  it("rejects files that are not WebVTT, since kunder kan uploade forkerte filtyper ved en fejl", () => {
    expect(looksLikeWebVtt("1\n00:00:00,000 --> 00:00:01,000\nHej")).toBe(false); // SRT
    expect(looksLikeWebVtt("")).toBe(false);
  });
});
