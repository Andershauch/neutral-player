import type { DetailedHTMLProps, VideoHTMLAttributes } from "react";

/// `<mux-video>` (fra @mux/mux-video) er et web component uden en officiel
/// React-pakke. Vi bruger det raa custom element direkte (se
/// components/player/CustomMuxPlayer.tsx), saa JSX skal kende til det.
/// Mux-specifikke attributter er kebab-case, ligesom de reelt hedder i HTML —
/// custom elements faar IKKE React's sædvanlige camelCase-til-kebab-case
/// oversættelse, saa vi skriver dem, som elementet selv forventer dem.
///
/// React 19's typer flyttede JSX.IntrinsicElements ind under React's egen
/// namespace, saa den klassiske globale `declare global { namespace JSX }`
/// augmentering rammer ikke laengere — den rigtige vej er at augmentere
/// "react"-modulet direkte.
declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "mux-video": DetailedHTMLProps<VideoHTMLAttributes<HTMLVideoElement>, HTMLVideoElement> & {
        "playback-id"?: string;
        "stream-type"?: string;
        "env-key"?: string;
        crossorigin?: string;
        playsinline?: string;
      };
    }
  }
}

export {};
