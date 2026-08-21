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
