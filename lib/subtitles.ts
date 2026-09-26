/// Sprog Mux kan auto-generere undertekster paa.
/// Kilde: Mux "Add auto-generated captions". `beta` betyder lavere praecision,
/// hvilket vi siger tydeligt i UI'et frem for at skjule det.
/// Koderne er literale, saa de kan gives videre til Mux' typede sprogunion
/// uden cast. Tilfoej kun sprog Mux faktisk understoetter.
export type SubtitleLanguageCode =
  | "da"
  | "en"
  | "de"
  | "es"
  | "fr"
  | "it"
  | "nl"
  | "pt"
  | "sv"
  | "no"
  | "fi"
  | "pl";

export interface SubtitleLanguage {
  code: SubtitleLanguageCode;
  label: string;
  beta: boolean;
}

export const GENERATED_SUBTITLE_LANGUAGES: SubtitleLanguage[] = [
  { code: "da", label: "Dansk", beta: true },
  { code: "en", label: "English", beta: false },
  { code: "de", label: "Deutsch", beta: false },
  { code: "es", label: "Español", beta: false },
  { code: "fr", label: "Français", beta: false },
  { code: "it", label: "Italiano", beta: false },
  { code: "nl", label: "Nederlands", beta: false },
  { code: "pt", label: "Português", beta: false },
  { code: "sv", label: "Svenska", beta: true },
  { code: "no", label: "Norsk", beta: true },
  { code: "fi", label: "Suomi", beta: true },
  { code: "pl", label: "Polski", beta: true },
];

export function isSupportedSubtitleLanguage(code: string): code is SubtitleLanguageCode {
  return GENERATED_SUBTITLE_LANGUAGES.some((lang) => lang.code === code);
}

export function getSubtitleLanguage(code: string): SubtitleLanguage | null {
  return GENERATED_SUBTITLE_LANGUAGES.find((lang) => lang.code === code) ?? null;
}

/// Navnet der vises i afspillerens undertekstmenu.
export function buildSubtitleTrackName(code: string): string {
  const language = getSubtitleLanguage(code);
  return language ? `${language.label} (auto)` : `${code.toUpperCase()} (auto)`;
}

export type SubtitleStatus = "requested" | "ready" | "errored";

export function getSubtitleStatusLabel(status: string): string {
  if (status === "ready") return "Klar";
  if (status === "errored") return "Fejlede";
  return "Behandles";
}

/// Mux serverer det faerdige undertekstspor som en almindelig VTT-fil på
/// dette faste mønster, naar sporet er "ready" og vi kender dets track-id.
export function buildMuxSubtitleUrl(playbackId: string, muxTrackId: string): string {
  return `https://stream.mux.com/${playbackId}/text/${muxTrackId}.vtt`;
}

/// Sprogkode for kundens egen uploadede fil. Løsere end Mux' auto-liste,
/// da kunden kan tekste til f.eks. tegnsprog eller regionale varianter,
/// som Mux ikke kan generere selv.
const CUSTOM_SUBTITLE_LANGUAGE_CODE_PATTERN = /^[a-z]{2,3}(-[a-z0-9]{2,8})?$/i;

export function isValidCustomSubtitleLanguageCode(code: string): boolean {
  return CUSTOM_SUBTITLE_LANGUAGE_CODE_PATTERN.test(code.trim());
}

/// Maks. størrelse på en uploadet .vtt-fil. Undertekster er tekst, saa dette
/// er rigeligt selv til en times video, og holder raadata-kolonnen i DB'en fornuftig.
export const MAX_UPLOADED_VTT_BYTES = 300 * 1024;

/// Meget let validering: vi parser ikke hele VTT-grammatikken, men afviser
/// tydeligt forkerte filer (forkert format, tom fil, forkert MIME-indhold),
/// før de gemmes og vises i afspilleren.
export function looksLikeWebVtt(content: string): boolean {
  const withoutBom = content.replace(/^﻿/, "");
  const firstLine = withoutBom.trimStart().split(/\r?\n/, 1)[0] ?? "";
  return firstLine.trim().startsWith("WEBVTT");
}
