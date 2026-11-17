import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  getTranscriptDirection,
  MAX_TRANSCRIPT_FILE_BYTES,
  parseTranscriptFile,
  readStoredTranscript,
  splitTranscriptByLanguage,
} from "@/lib/transcript";

const lang = {
  languageName: "Dansk",
  summary: "Læs tekstversion",
  speaker: "Fortæller",
  sections: [
    {
      heading: "Intro",
      blocks: [
        { type: "visual", text: "Et hus." },
        { type: "speech", text: "Hej.", cues: [1, 3] },
      ],
    },
  ],
};

const file = (extra: object = {}) =>
  JSON.stringify({ languages: { da: lang, ar: { ...lang, languageName: "العربية" } }, ...extra });

describe("parseTranscriptFile", () => {
  it("accepts a valid file and drops review fields", () => {
    const result = parseTranscriptFile(
      file({ review: ["internt"], reviewIntro: "intern note" }),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(Object.keys(result.languages)).toEqual(["da", "ar"]);
    expect(JSON.stringify(result.languages)).not.toContain("internt");
  });

  it("drops unknown fields inside languages", () => {
    const withExtra = JSON.stringify({ languages: { da: { ...lang, cueCount: 5, review: "x" } } });
    const result = parseTranscriptFile(withExtra);
    expect(result.ok && "cueCount" in result.languages.da).toBe(false);
    expect(result.ok && "review" in result.languages.da).toBe(false);
  });

  it("rejects invalid JSON and wrong shape", () => {
    expect(parseTranscriptFile("{nope").ok).toBe(false);
    expect(parseTranscriptFile("[]").ok).toBe(false);
    expect(parseTranscriptFile('{"languages":{}}').ok).toBe(false);
    expect(parseTranscriptFile('{"languages":{"da":{"sections":[]}}}').ok).toBe(false);
  });

  it("rejects unknown block types and bad cues", () => {
    const bad = (block: object) =>
      JSON.stringify({ languages: { da: { ...lang, sections: [{ heading: "H", blocks: [block] }] } } });
    expect(parseTranscriptFile(bad({ type: "html", text: "x" })).ok).toBe(false);
    expect(parseTranscriptFile(bad({ type: "speech", text: "x", cues: [1] })).ok).toBe(false);
    expect(parseTranscriptFile(bad({ type: "speech", text: "" })).ok).toBe(false);
  });

  it("rejects invalid language codes", () => {
    expect(parseTranscriptFile(JSON.stringify({ languages: { "<script>": lang } })).ok).toBe(false);
  });

  it("rejects files that are too large", () => {
    const big = file({ padding: "x".repeat(MAX_TRANSCRIPT_FILE_BYTES) });
    const result = parseTranscriptFile(big);
    expect(result.ok).toBe(false);
  });

  const sample = path.resolve(__dirname, "../../../videoer/fleksjob/fleksjob.transcript.json");
  it.skipIf(!existsSync(sample))("accepts the real fleksjob sample (5 languages)", () => {
    const result = parseTranscriptFile(readFileSync(sample, "utf8"));
    expect(result.ok).toBe(true);
    if (result.ok) expect(Object.keys(result.languages).sort()).toEqual(["ar", "da", "en", "pl", "uk"]);
  });
});

describe("getTranscriptDirection", () => {
  it("returns rtl for ar, fa, he, ur and ltr otherwise", () => {
    expect(getTranscriptDirection("ar")).toBe("rtl");
    expect(getTranscriptDirection("AR")).toBe("rtl");
    expect(getTranscriptDirection("he-IL")).toBe("rtl");
    expect(getTranscriptDirection("da")).toBe("ltr");
    expect(getTranscriptDirection("uk")).toBe("ltr");
  });
});

describe("splitTranscriptByLanguage", () => {
  it("assigns by language and reports mismatches", () => {
    const parsed = parseTranscriptFile(file());
    if (!parsed.ok) throw new Error("setup");
    const result = splitTranscriptByLanguage(parsed.languages, [
      { id: "v1", lang: "da" },
      { id: "v2", lang: "EN" },
    ]);
    expect([...result.assignments.keys()]).toEqual(["v1"]);
    expect(result.languagesWithoutVideo).toEqual(["ar"]);
    expect(result.variantsWithoutText).toEqual(["EN"]);
  });
});

describe("readStoredTranscript", () => {
  it("returns null for garbage and data for valid values", () => {
    expect(readStoredTranscript(null)).toBeNull();
    expect(readStoredTranscript({ foo: 1 })).toBeNull();
    expect(readStoredTranscript(lang)?.summary).toBe("Læs tekstversion");
  });
});
