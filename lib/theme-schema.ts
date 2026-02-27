export type ThemeScope = "organization" | "global_default";
export type ThemeStatus = "draft" | "published" | "archived";

const HEX_COLOR_REGEX = /^#([0-9a-f]{6}|[0-9a-f]{3})$/i;

const ALLOWED_FONT_FAMILIES = new Set(["Apex New", "Inter", "Roboto", "Source Sans 3", "Manrope"]);
const ALLOWED_FONT_WEIGHTS = new Set([400, 500, 600, 700, 800]);

export interface ThemeTokens {
  colors: {
    background: string;
    surface: string;
    foreground: string;
    muted: string;
    line: string;
    primary: string;
    primaryStrong: string;
    successBg: string;
    successFg: string;
    warningBg: string;
    warningFg: string;
    danger: string;
  };
  typography: {
    fontFamily: string;
    headingWeight: number;
    bodyWeight: number;
  };
  radius: {
    card: string;
    pill: string;
  };
  shadows: {
    card: string;
  };
  player: {
    playButtonBg: string;
    playButtonBorder: string;
    playButtonHoverBg: string;
    playButtonHoverBorder: string;
    playButtonShadow: string;
  };
}

export const DEFAULT_THEME_TOKENS: ThemeTokens = {
  colors: {
    background: "#f8fafc",
    surface: "#ffffff",
    foreground: "#0f172a",
    muted: "#64748b",
    line: "#e2e8f0",
    primary: "#2563eb",
    primaryStrong: "#1d4ed8",
    successBg: "#ecfdf5",
    successFg: "#047857",
    warningBg: "#fffbeb",
    warningFg: "#b45309",
    danger: "#dc2626",
  },
  typography: {
    fontFamily: "Apex New",
    headingWeight: 700,
    bodyWeight: 400,
  },
  radius: {
    card: "2rem",
    pill: "0.75rem",
  },
  shadows: {
    card: "0 1px 2px rgba(15, 23, 42, 0.05)",
  },
  player: {
    playButtonBg: "rgba(0, 0, 0, 0.45)",
    playButtonBorder: "rgba(255, 255, 255, 0.8)",
    playButtonHoverBg: "#ff5ca8",
    playButtonHoverBorder: "#ff5ca8",
    playButtonShadow: "0 8px 24px rgba(255, 92, 168, 0.35)",
  },
};

export interface ThemeValidationResult {
  ok: boolean;
  errors: string[];
  value: ThemeTokens | null;
}

export function validateThemeTokens(input: unknown): ThemeValidationResult {
  const errors: string[] = [];
  if (!isRecord(input)) {
    return { ok: false, errors: ["Theme payload skal være et objekt."], value: null };
  }

  const colors = requireObject(input, "colors", errors);
  const typography = requireObject(input, "typography", errors);
  const radius = requireObject(input, "radius", errors);
  const shadows = requireObject(input, "shadows", errors);
  const player = requireObject(input, "player", errors);

  if (!colors || !typography || !radius || !shadows || !player) {
    return { ok: false, errors, value: null };
  }

  const value: ThemeTokens = {
    colors: {
      background: requireColor(colors, "background", errors),
      surface: requireColor(colors, "surface", errors),
      foreground: requireColor(colors, "foreground", errors),
      muted: requireColor(colors, "muted", errors),
      line: requireColor(colors, "line", errors),
      primary: requireColor(colors, "primary", errors),
      primaryStrong: requireColor(colors, "primaryStrong", errors),
      successBg: requireColor(colors, "successBg", errors),
      successFg: requireColor(colors, "successFg", errors),
      warningBg: requireColor(colors, "warningBg", errors),
      warningFg: requireColor(colors, "warningFg", errors),
      danger: requireColor(colors, "danger", errors),
    },
    typography: {
      fontFamily: requireFontFamily(typography, "fontFamily", errors),
      headingWeight: requireFontWeight(typography, "headingWeight", errors),
      bodyWeight: requireFontWeight(typography, "bodyWeight", errors),
    },
    radius: {
      card: requireRadiusValue(radius, "card", errors),
      pill: requireRadiusValue(radius, "pill", errors),
    },
    shadows: {
      card: requireShadowValue(shadows, "card", errors),
    },
    player: {
      playButtonBg: requireColorOrRgba(player, "playButtonBg", errors),
      playButtonBorder: requireColorOrRgba(player, "playButtonBorder", errors),
      playButtonHoverBg: requireColorOrRgba(player, "playButtonHoverBg", errors),
      playButtonHoverBorder: requireColorOrRgba(player, "playButtonHoverBorder", errors),
      playButtonShadow: requireShadowValue(player, "playButtonShadow", errors),
    },
  };

  if (errors.length > 0) {
    return { ok: false, errors, value: null };
  }

  return { ok: true, errors: [], value };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requireObject(parent: Record<string, unknown>, key: string, errors: string[]): Record<string, unknown> | null {
  const value = parent[key];
  if (!isRecord(value)) {
    errors.push(`Felten "${key}" mangler eller er ugyldig.`);
    return null;
  }
  return value;
}

function requireColor(parent: Record<string, unknown>, key: string, errors: string[]): string {
  const value = readString(parent, key, errors);
  if (!HEX_COLOR_REGEX.test(value)) {
    errors.push(`"${key}" skal være HEX-farve (fx #2563eb).`);
  }
  return value;
}

function requireColorOrRgba(parent: Record<string, unknown>, key: string, errors: string[]): string {
  const value = readString(parent, key, errors);
  const rgbaLike = value.startsWith("rgba(") && value.endsWith(")");
  if (!HEX_COLOR_REGEX.test(value) && !rgbaLike) {
    errors.push(`"${key}" skal være HEX eller rgba(...).`);
  }
  return value;
}

function requireFontFamily(parent: Record<string, unknown>, key: string, errors: string[]): string {
  const value = readString(parent, key, errors);
  if (!ALLOWED_FONT_FAMILIES.has(value)) {
    errors.push(`"${key}" skal være en tilladt fontfamilie.`);
  }
  return value;
}

function requireFontWeight(parent: Record<string, unknown>, key: string, errors: string[]): number {
  const value = parent[key];
  if (typeof value !== "number" || !ALLOWED_FONT_WEIGHTS.has(value)) {
    errors.push(`"${key}" skal være en tilladt font-weight.`);
    return 400;
  }
  return value;
}

function requireRadiusValue(parent: Record<string, unknown>, key: string, errors: string[]): string {
  const value = readString(parent, key, errors);
  const isAllowed = /^([0-9]+(\.[0-9]+)?)(px|rem)$/.test(value);
  if (!isAllowed) {
    errors.push(`"${key}" skal være i px/rem format.`);
  }
  return value;
}

function requireShadowValue(parent: Record<string, unknown>, key: string, errors: string[]): string {
  const value = readString(parent, key, errors);
  if (value.length < 6 || value.length > 120) {
    errors.push(`"${key}" har ugyldig længde.`);
  }
  return value;
}

function readString(parent: Record<string, unknown>, key: string, errors: string[]): string {
  const value = parent[key];
  if (typeof value !== "string" || !value.trim()) {
    errors.push(`"${key}" mangler eller er tom.`);
    return "";
  }
  const trimmed = value.trim();
  if (trimmed.length > 120) {
    errors.push(`"${key}" er for lang.`);
  }
  return trimmed;
}
