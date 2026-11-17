/// Accessible text version (transcript) of a video, stored per variant.
/// The upload file contains all languages of one embed; `parseTranscriptFile`
/// validates it and `splitTranscriptByLanguage` produces the per-variant payloads.
/// Only whitelisted fields are kept, so internal review notes never reach the DB.

export const MAX_TRANSCRIPT_FILE_BYTES = 500 * 1024;
export const MAX_TRANSCRIPT_SECTIONS = 100;
export const MAX_TRANSCRIPT_BLOCKS_PER_SECTION = 500;
export const MAX_TRANSCRIPT_TEXT_LENGTH = 5000;

const RTL_LANGUAGES = new Set(["ar", "fa", "he", "ur"]);
const LANGUAGE_KEY_PATTERN = /^[a-z]{2,3}(-[a-z0-9]{2,8})?$/i;

export type TranscriptBlock =
  | { type: "visual"; text: string }
  | { type: "speech"; text: string; cues?: [number, number] };

export interface TranscriptSection {
  heading: string;
  blocks: TranscriptBlock[];
}

export interface TranscriptData {
  languageName: string;
  summary: string;
  speaker: string;
  sections: TranscriptSection[];
}

export type TranscriptParseResult =
  | { ok: true; languages: Record<string, TranscriptData> }
  | { ok: false; error: string };

export type TranscriptDirection = "ltr" | "rtl";

export function getTranscriptDirection(lang: string): TranscriptDirection {
  const base = lang.trim().toLowerCase().split("-")[0] ?? "";
  return RTL_LANGUAGES.has(base) ? "rtl" : "ltr";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readText(value: unknown, label: string, allowEmpty = false): string {
  if (typeof value !== "string") throw new Error(`${label} skal være tekst.`);
  const trimmed = value.trim();
  if (!allowEmpty && trimmed.length === 0) throw new Error(`${label} må ikke være tom.`);
  if (trimmed.length > MAX_TRANSCRIPT_TEXT_LENGTH) {
    throw new Error(`${label} er for lang (maks. ${MAX_TRANSCRIPT_TEXT_LENGTH} tegn).`);
  }
  return trimmed;
}

function readCues(value: unknown, label: string): [number, number] | undefined {
  if (value === undefined || value === null) return undefined;
  if (
    !Array.isArray(value) ||
    value.length !== 2 ||
    !value.every((n) => Number.isInteger(n) && n >= 0)
  ) {
    throw new Error(`${label}: cues skal være to heltal.`);
  }
  return [value[0] as number, value[1] as number];
}

function parseBlock(raw: unknown, label: string): TranscriptBlock {
  if (!isRecord(raw)) throw new Error(`${label} har forkert form.`);
  const text = readText(raw.text, `${label}: text`);
  if (raw.type === "visual") return { type: "visual", text };
  if (raw.type === "speech") {
    const cues = readCues(raw.cues, label);
    return cues ? { type: "speech", text, cues } : { type: "speech", text };
  }
  throw new Error(`${label}: type skal være "visual" eller "speech".`);
}

function parseLanguage(raw: unknown, lang: string): TranscriptData {
  const label = `Sprog "${lang}"`;
  if (!isRecord(raw)) throw new Error(`${label} har forkert form.`);
  if (!Array.isArray(raw.sections) || raw.sections.length === 0) {
    throw new Error(`${label} mangler sections.`);
  }
  if (raw.sections.length > MAX_TRANSCRIPT_SECTIONS) {
    throw new Error(`${label} har for mange sektioner (maks. ${MAX_TRANSCRIPT_SECTIONS}).`);
  }
  const sections = raw.sections.map((section, i): TranscriptSection => {
    const sectionLabel = `${label}, sektion ${i + 1}`;
    if (!isRecord(section)) throw new Error(`${sectionLabel} har forkert form.`);
    if (!Array.isArray(section.blocks) || section.blocks.length === 0) {
      throw new Error(`${sectionLabel} mangler blocks.`);
    }
    if (section.blocks.length > MAX_TRANSCRIPT_BLOCKS_PER_SECTION) {
      throw new Error(`${sectionLabel} har for mange blokke.`);
    }
    return {
      heading: readText(section.heading, `${sectionLabel}: heading`),
      blocks: section.blocks.map((b, j) => parseBlock(b, `${sectionLabel}, blok ${j + 1}`)),
    };
  });
  return {
    languageName: readText(raw.languageName, `${label}: languageName`),
    summary: readText(raw.summary, `${label}: summary`),
    speaker: readText(raw.speaker, `${label}: speaker`),
    sections,
  };
}

/// Validates the uploaded JSON text. Unknown fields (`review`, `reviewIntro`, ...) are dropped.
export function parseTranscriptFile(content: string): TranscriptParseResult {
  if (Buffer.byteLength(content, "utf8") > MAX_TRANSCRIPT_FILE_BYTES) {
    return { ok: false, error: `Filen er for stor (maks. ${MAX_TRANSCRIPT_FILE_BYTES / 1024} KB).` };
  }
  let json: unknown;
  try {
    json = JSON.parse(content.replace(/^﻿/, ""));
  } catch {
    return { ok: false, error: "Filen er ikke gyldig JSON." };
  }
  if (!isRecord(json) || !isRecord(json.languages)) {
    return { ok: false, error: 'Filen mangler "languages".' };
  }
  const entries = Object.entries(json.languages);
  if (entries.length === 0) return { ok: false, error: "Filen indeholder ingen sprog." };

  const languages: Record<string, TranscriptData> = {};
  try {
    for (const [lang, raw] of entries) {
      if (!LANGUAGE_KEY_PATTERN.test(lang)) throw new Error(`Ugyldig sprogkode "${lang}".`);
      languages[lang.toLowerCase()] = parseLanguage(raw, lang);
    }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Ugyldig fil." };
  }
  return { ok: true, languages };
}

export interface TranscriptSplitResult {
  /// variantId -> transcript to store
  assignments: Map<string, TranscriptData>;
  /// languages in the file with no matching variant
  languagesWithoutVideo: string[];
  /// variants (by language) that received no text
  variantsWithoutText: string[];
}

/// Distributes the parsed languages to variants by language code (case-insensitive).
export function splitTranscriptByLanguage(
  languages: Record<string, TranscriptData>,
  variants: { id: string; lang: string }[],
): TranscriptSplitResult {
  const assignments = new Map<string, TranscriptData>();
  const used = new Set<string>();
  const variantsWithoutText: string[] = [];
  for (const variant of variants) {
    const key = variant.lang.trim().toLowerCase();
    const data = languages[key];
    if (data) {
      assignments.set(variant.id, data);
      used.add(key);
    } else {
      variantsWithoutText.push(variant.lang);
    }
  }
  const languagesWithoutVideo = Object.keys(languages).filter((lang) => !used.has(lang));
  return { assignments, languagesWithoutVideo, variantsWithoutText };
}

/// Reads a stored `Variant.transcript` value defensively before rendering.
export function readStoredTranscript(value: unknown): TranscriptData | null {
  try {
    return parseLanguage(value, "gemt");
  } catch {
    return null;
  }
}
