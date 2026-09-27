import type { CSSProperties } from "react";
import type { ThemeTokens } from "@/lib/theme-schema";

export function buildThemeCssVars(tokens: ThemeTokens): CSSProperties {
  return {
    ["--background" as string]: tokens.colors.background,
    ["--surface" as string]: tokens.colors.surface,
    ["--foreground" as string]: tokens.colors.foreground,
    ["--muted" as string]: tokens.colors.muted,
    ["--line" as string]: tokens.colors.line,
    ["--primary" as string]: tokens.colors.primary,
    ["--primary-strong" as string]: tokens.colors.primaryStrong,
    ["--success-bg" as string]: tokens.colors.successBg,
    ["--success-fg" as string]: tokens.colors.successFg,
    ["--warning-bg" as string]: tokens.colors.warningBg,
    ["--warning-fg" as string]: tokens.colors.warningFg,
    ["--danger" as string]: tokens.colors.danger,

    ["--font-family-sans" as string]: `"${tokens.typography.fontFamily}", "Segoe UI", sans-serif`,
    ["--font-weight-heading" as string]: String(tokens.typography.headingWeight),
    ["--font-weight-body" as string]: String(tokens.typography.bodyWeight),

    ["--radius-card" as string]: tokens.radius.card,
    ["--radius-pill" as string]: tokens.radius.pill,
    ["--shadow-card" as string]: tokens.shadows.card,

    ["--np-player-play-bg" as string]: tokens.player.playButtonBg,
    ["--np-player-play-border" as string]: tokens.player.playButtonBorder,
    ["--np-player-play-hover-bg" as string]: tokens.player.playButtonHoverBg,
    ["--np-player-play-hover-border" as string]: tokens.player.playButtonHoverBorder,
    ["--np-player-play-shadow" as string]: tokens.player.playButtonShadow,
    ["--np-player-control-bg" as string]: tokens.player.controlBg,
    ["--np-player-control-border" as string]: tokens.player.controlBorder,
    ["--np-player-control-hover-bg" as string]: tokens.player.controlHoverBg,

    // Declared here (not just once at :root in globals.css) with the literal
    // resolved primary baked in, not var(--primary): a custom property whose
    // value contains var() is substituted once, using the value in scope where
    // it is DECLARED, and that already-resolved value is what inherits — so a
    // color-mix(var(--primary)) declared only at :root stays pinned to the
    // default --primary forever, even under a descendant that overrides
    // --primary (like this org's own .np-themed root). Redeclaring it here,
    // per organization, is what makes the embed player's accent actually track
    // the org's brand color instead of silently staying blue.
    ["--np-player-accent" as string]: `color-mix(in srgb, ${tokens.colors.primary} 55%, white)`,
    ["--np-player-accent-strong" as string]: `color-mix(in srgb, ${tokens.colors.primary} 80%, white)`,
  };
}
